import { FindPreventiveTreatmentScheduleUc } from '@/usecase/find-preventive-treatment-schedule.uc';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { createQueryBuilderMock } from './helpers';

const entity = {
  id: 'pts-1',
  treatment: { id: 'pt-1', user: { id: 'u-1' } },
  scheduledAt: new Date('2026-01-15T08:00:00Z'),
  reminderBeforeLog: 30,
};

describe('FindPreventiveTreatmentScheduleUc', () => {
  const build = (
    getOne: unknown,
  ): {
    uc: FindPreventiveTreatmentScheduleUc;
    query: ReturnType<typeof createQueryBuilderMock>;
  } => {
    const query = createQueryBuilderMock({ getOne });
    const scheduleRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as PreventiveTreatmentScheduleRepository;
    return { uc: new FindPreventiveTreatmentScheduleUc(scheduleRepository), query };
  };

  it('finds a schedule scoped by id and the treatment owner', async () => {
    const { uc, query } = build(entity);

    const result = await uc.execute({ id: 'pts-1', userId: 'u-1' });

    expect(query.where).toHaveBeenCalledWith('pts.id = :id', { id: 'pts-1' });
    expect(query.andWhere).toHaveBeenCalledWith('pt.user_id = :userId', { userId: 'u-1' });
    expect(result).toEqual({
      id: 'pts-1',
      preventiveTreatmentId: 'pt-1',
      scheduledAt: entity.scheduledAt,
      reminderBeforeLog: 30,
    });
  });

  it('returns null when no matching schedule is found', async () => {
    const { uc } = build(null);

    const result = await uc.execute({ id: 'pts-1', userId: 'u-1' });

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
