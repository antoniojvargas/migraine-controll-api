import { FindMigraineLogUc } from '@/usecase/find-migraine-log.uc';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { createQueryBuilderMock } from './helpers';

const entity = {
  id: 'ml-1',
  user: { id: 'u-1' },
  session: null,
  intensity: 5,
  painLocation: 'left',
  startedAt: new Date('2026-01-01T00:00:00Z'),
  endedAt: null,
};

describe('FindMigraineLogUc', () => {
  const build = (
    getOne: unknown,
  ): {
    uc: FindMigraineLogUc;
    migraineLogRepository: MigraineLogRepository;
    query: ReturnType<typeof createQueryBuilderMock>;
  } => {
    const query = createQueryBuilderMock({ getOne });
    const migraineLogRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as MigraineLogRepository;
    return { uc: new FindMigraineLogUc(migraineLogRepository), migraineLogRepository, query };
  };

  it('finds a migraine log scoped by id and userId', async () => {
    const { uc, query } = build(entity);

    const result = await uc.execute({ id: 'ml-1', userId: 'u-1' });

    expect(query.where).toHaveBeenCalledWith('ml.id = :id', { id: 'ml-1' });
    expect(query.andWhere).toHaveBeenCalledWith('ml.user_id = :userId', { userId: 'u-1' });
    expect(result).toEqual({
      id: 'ml-1',
      userId: 'u-1',
      sessionId: null,
      intensity: 5,
      painLocation: 'left',
      startedAt: entity.startedAt,
      endedAt: null,
    });
  });

  it('returns null when no matching log is found', async () => {
    const { uc } = build(null);

    const result = await uc.execute({ id: 'ml-1', userId: 'u-1' });

    expect(result).toBeNull();
  });

  it('rejects when id is missing', async () => {
    const { uc } = build(null);

    await expect(uc.execute({ id: '', userId: 'u-1' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
