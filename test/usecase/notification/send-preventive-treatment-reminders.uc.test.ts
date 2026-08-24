import { SendPreventiveTreatmentRemindersUc } from '@/usecase/notification/send-preventive-treatment-reminders.uc';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { PreventiveTreatmentScheduleMetadataRepository } from '@/infra/database/repository/preventive-treatment-schedule-metadata.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { notifyUsers } from '@/usecase/notification/notificationHelpers';
import { createQueryBuilderMock } from '../helpers';

jest.mock('@/usecase/notification/notificationHelpers', () => ({
  notifyUsers: jest.fn(),
}));

const notifyUsersMock = notifyUsers as jest.Mock;

const dueSchedule = {
  id: 'schedule-1',
  treatment: { id: 'treatment-1', name: 'Propranolol', user: { id: 'user-1' } },
};

describe('SendPreventiveTreatmentRemindersUc', () => {
  const build = (
    getMany: unknown = [],
    metadata: unknown = null,
    tokens: unknown = [],
  ): {
    uc: SendPreventiveTreatmentRemindersUc;
    query: ReturnType<typeof createQueryBuilderMock>;
    scheduleRepository: PreventiveTreatmentScheduleRepository;
    metadataRepository: PreventiveTreatmentScheduleMetadataRepository;
    tokenRepository: PushNotificationTokenRepository;
  } => {
    const query = createQueryBuilderMock({ getMany });
    const scheduleRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as PreventiveTreatmentScheduleRepository;
    const metadataRepository = {
      findOneBy: jest.fn().mockResolvedValue(metadata),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as PreventiveTreatmentScheduleMetadataRepository;
    const tokenRepository = {
      findAllBy: jest.fn().mockResolvedValue(tokens),
    } as unknown as PushNotificationTokenRepository;

    return {
      uc: new SendPreventiveTreatmentRemindersUc(
        scheduleRepository,
        metadataRepository,
        tokenRepository,
      ),
      query,
      scheduleRepository,
      metadataRepository,
      tokenRepository,
    };
  };

  afterEach(() => {
    notifyUsersMock.mockReset();
  });

  it('returns zero reminders sent when there are no due schedules', async () => {
    const { uc, query } = build([]);

    const result = await uc.execute();

    expect(query.andWhere).toHaveBeenCalledWith('metadata.reminded_at IS NULL');
    expect(result).toEqual({ remindersSent: 0 });
    expect(notifyUsersMock).not.toHaveBeenCalled();
  });

  it('notifies the treatment owner and creates reminder metadata when none exists', async () => {
    notifyUsersMock.mockResolvedValue(undefined);
    const tokens = [{ id: 'token-1', token: 'abc' }];
    const { uc, tokenRepository, metadataRepository } = build([dueSchedule], null, tokens);

    const result = await uc.execute();

    expect(tokenRepository.findAllBy).toHaveBeenCalledWith({ user: { id: 'user-1' } });
    expect(notifyUsersMock).toHaveBeenCalledWith(
      [{ userId: 'user-1', tokens }],
      expect.objectContaining({
        title: expect.any(String),
        body: expect.stringContaining('Propranolol'),
        data: { scheduleId: 'schedule-1' },
      }),
    );
    expect(metadataRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ schedule: { id: 'schedule-1' }, remindedAt: expect.any(Date) }),
    );
    expect(metadataRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual({ remindersSent: 1 });
  });

  it('updates existing reminder metadata instead of creating a new row', async () => {
    notifyUsersMock.mockResolvedValue(undefined);
    const { uc, metadataRepository } = build(
      [dueSchedule],
      { id: 'metadata-1', remindedAt: null },
      [],
    );

    await uc.execute();

    expect(metadataRepository.update).toHaveBeenCalledWith(
      { id: 'metadata-1' },
      expect.objectContaining({ remindedAt: expect.any(Date) }),
    );
    expect(metadataRepository.create).not.toHaveBeenCalled();
  });

  it('propagates errors from notifyUsers', async () => {
    notifyUsersMock.mockRejectedValue(new Error('sqs unavailable'));
    const { uc } = build([dueSchedule]);

    await expect(uc.execute()).rejects.toThrow('sqs unavailable');
  });
});
