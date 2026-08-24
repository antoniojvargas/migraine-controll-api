import { SendWeeklyMigraineTrendAlertsUc } from '@/usecase/notification/send-weekly-migraine-trend-alerts.uc';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { notifyUsers } from '@/usecase/notification/notificationHelpers';
import { getWeekStart } from '@/usecase/notification/dateHelpers';
import { createQueryBuilderMock } from '../helpers';

jest.mock('@/usecase/notification/notificationHelpers', () => ({
  notifyUsers: jest.fn(),
}));

const notifyUsersMock = notifyUsers as jest.Mock;

const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const currentWeekDate = (): Date => new Date(getWeekStart(new Date()).getTime() + 60 * 60 * 1000);

describe('SendWeeklyMigraineTrendAlertsUc', () => {
  const build = (
    getRawMany: unknown = [],
    tokens: unknown = [],
  ): {
    uc: SendWeeklyMigraineTrendAlertsUc;
    query: ReturnType<typeof createQueryBuilderMock>;
    migraineLogRepository: MigraineLogRepository;
    pushNotificationTokenRepository: PushNotificationTokenRepository;
  } => {
    const query = createQueryBuilderMock({ getRawMany });
    const migraineLogRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as MigraineLogRepository;
    const pushNotificationTokenRepository = {
      findAllBy: jest.fn().mockResolvedValue(tokens),
    } as unknown as PushNotificationTokenRepository;

    return {
      uc: new SendWeeklyMigraineTrendAlertsUc(
        migraineLogRepository,
        pushNotificationTokenRepository,
      ),
      query,
      migraineLogRepository,
      pushNotificationTokenRepository,
    };
  };

  afterEach(() => {
    notifyUsersMock.mockReset();
  });

  it('returns zero alerts when there are no recent logs', async () => {
    const { uc } = build([]);

    const result = await uc.execute();

    expect(result).toEqual({ alertsSent: 0 });
    expect(notifyUsersMock).not.toHaveBeenCalled();
  });

  it('skips users without a prior-week baseline', async () => {
    const { uc } = build([{ userId: 'user-1', startedAt: currentWeekDate() }]);

    const result = await uc.execute();

    expect(result).toEqual({ alertsSent: 0 });
    expect(notifyUsersMock).not.toHaveBeenCalled();
  });

  it('notifies when the current week is a significant increase over the baseline', async () => {
    notifyUsersMock.mockResolvedValue(undefined);
    const tokens = [{ id: 'token-1', token: 'abc' }];
    const rows = [
      { userId: 'user-1', startedAt: daysAgo(21) },
      { userId: 'user-1', startedAt: currentWeekDate() },
      { userId: 'user-1', startedAt: currentWeekDate() },
      { userId: 'user-1', startedAt: currentWeekDate() },
    ];
    const { uc, pushNotificationTokenRepository } = build(rows, tokens);

    const result = await uc.execute();

    expect(pushNotificationTokenRepository.findAllBy).toHaveBeenCalledWith({
      user: { id: 'user-1' },
    });
    expect(notifyUsersMock).toHaveBeenCalledWith(
      [{ userId: 'user-1', tokens }],
      expect.objectContaining({
        title: expect.any(String),
        body: expect.stringContaining('increase'),
        data: expect.objectContaining({ direction: 'increase' }),
      }),
    );
    expect(result).toEqual({ alertsSent: 1 });
  });

  it('does not notify when the variation is within the normal range', async () => {
    const rows = [
      { userId: 'user-1', startedAt: daysAgo(7) },
      { userId: 'user-1', startedAt: currentWeekDate() },
    ];
    const { uc } = build(rows);

    const result = await uc.execute();

    expect(result).toEqual({ alertsSent: 0 });
    expect(notifyUsersMock).not.toHaveBeenCalled();
  });

  it('propagates errors from notifyUsers', async () => {
    notifyUsersMock.mockRejectedValue(new Error('sqs unavailable'));
    const rows = [
      { userId: 'user-1', startedAt: daysAgo(21) },
      { userId: 'user-1', startedAt: currentWeekDate() },
      { userId: 'user-1', startedAt: currentWeekDate() },
      { userId: 'user-1', startedAt: currentWeekDate() },
    ];
    const { uc } = build(rows);

    await expect(uc.execute()).rejects.toThrow('sqs unavailable');
  });
});
