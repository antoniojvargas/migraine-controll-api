import { FindPreventiveTreatmentsUc } from '@/usecase/find-preventive-treatments.uc';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { createQueryBuilderMock } from './helpers';

const entities = [
  { id: 'pt-1', user: { id: 'u-1' }, name: 'Propranolol', isRecurrent: true, repeatUntil: null },
  { id: 'pt-2', user: { id: 'u-1' }, name: 'Topiramate', isRecurrent: false, repeatUntil: null },
];

describe('FindPreventiveTreatmentsUc', () => {
  const build = (
    getMany: unknown = [],
  ): { uc: FindPreventiveTreatmentsUc; query: ReturnType<typeof createQueryBuilderMock> } => {
    const query = createQueryBuilderMock({ getMany });
    const preventiveTreatmentRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as PreventiveTreatmentRepository;
    return { uc: new FindPreventiveTreatmentsUc(preventiveTreatmentRepository), query };
  };

  it('lists preventive treatments for a user ordered by name', async () => {
    const { uc, query } = build(entities);

    const result = await uc.execute({ userId: 'u-1' });

    expect(query.where).toHaveBeenCalledWith('pt.user_id = :userId', { userId: 'u-1' });
    expect(query.orderBy).toHaveBeenCalledWith('pt.name', 'ASC');
    expect(result).toEqual([
      { id: 'pt-1', userId: 'u-1', name: 'Propranolol', isRecurrent: true, repeatUntil: null },
      { id: 'pt-2', userId: 'u-1', name: 'Topiramate', isRecurrent: false, repeatUntil: null },
    ]);
  });

  it('returns an empty array when the user has no treatments', async () => {
    const { uc } = build([]);

    const result = await uc.execute({ userId: 'u-1' });

    expect(result).toEqual([]);
  });

  it('rejects when userId is missing', async () => {
    const { uc } = build([]);

    await expect(uc.execute({ userId: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
