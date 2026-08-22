import { FindCalendarViewUc } from '@/usecase/find-calendar-view.uc';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { createQueryBuilderMock } from './helpers';

const logs = [
  {
    id: 'ml-1',
    user: { id: 'u-1' },
    session: null,
    intensity: 5,
    painLocation: 'left',
    startedAt: new Date('2026-01-15T12:00:00Z'),
    endedAt: null,
  },
];

describe('FindCalendarViewUc', () => {
  const build = (
    getMany: unknown = [],
  ): { uc: FindCalendarViewUc; query: ReturnType<typeof createQueryBuilderMock> } => {
    const query = createQueryBuilderMock({ getMany });
    const migraineLogRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as MigraineLogRepository;
    return { uc: new FindCalendarViewUc(migraineLogRepository), query };
  };

  it('groups logs by local date for the given user', async () => {
    const { uc, query } = build(logs);

    const result = await uc.execute({ userId: 'u-1' });

    expect(query.where).toHaveBeenCalledWith('ml.user_id = :userId', { userId: 'u-1' });
    expect(result).toEqual({
      userId: 'u-1',
      months: [{ year: 2026, month: 1, days: [{ day: 15, logs: expect.any(Array) }] }],
    });
  });

  it('applies from/to date filters when provided', async () => {
    const { uc, query } = build([]);

    await uc.execute({ userId: 'u-1', from: '2026-01-01', to: '2026-01-31' });

    expect(query.andWhere).toHaveBeenCalledWith('ml.started_at >= :from', {
      from: new Date('2026-01-01'),
    });
    expect(query.andWhere).toHaveBeenCalledWith('ml.started_at <= :to', {
      to: new Date('2026-01-31'),
    });
  });

  it('rejects when from is after to', async () => {
    const { uc } = build([]);

    await expect(
      uc.execute({ userId: 'u-1', from: '2026-02-01', to: '2026-01-01' }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });

  it('rejects when userId is missing', async () => {
    const { uc } = build([]);

    await expect(uc.execute({ userId: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
