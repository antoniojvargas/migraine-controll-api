import { FindPreventiveTreatmentUc } from '@/usecase/find-preventive-treatment.uc';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { createQueryBuilderMock } from './helpers';

const entity = {
  id: 'pt-1',
  user: { id: 'u-1' },
  name: 'Propranolol',
  isRecurrent: true,
  repeatUntil: null,
};

describe('FindPreventiveTreatmentUc', () => {
  const build = (
    getOne: unknown,
  ): { uc: FindPreventiveTreatmentUc; query: ReturnType<typeof createQueryBuilderMock> } => {
    const query = createQueryBuilderMock({ getOne });
    const preventiveTreatmentRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as PreventiveTreatmentRepository;
    return { uc: new FindPreventiveTreatmentUc(preventiveTreatmentRepository), query };
  };

  it('finds a preventive treatment scoped by id and userId', async () => {
    const { uc, query } = build(entity);

    const result = await uc.execute({ id: 'pt-1', userId: 'u-1' });

    expect(query.where).toHaveBeenCalledWith('pt.id = :id', { id: 'pt-1' });
    expect(query.andWhere).toHaveBeenCalledWith('pt.user_id = :userId', { userId: 'u-1' });
    expect(result).toEqual({
      id: 'pt-1',
      userId: 'u-1',
      name: 'Propranolol',
      isRecurrent: true,
      repeatUntil: null,
    });
  });

  it('returns null when no matching treatment is found', async () => {
    const { uc } = build(null);

    const result = await uc.execute({ id: 'pt-1', userId: 'u-1' });

    expect(result).toBeNull();
  });

  it('rejects when userId is missing', async () => {
    const { uc } = build(null);

    await expect(uc.execute({ id: 'pt-1', userId: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
