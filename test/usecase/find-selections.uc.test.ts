import { FindSelectionsUc } from '@/usecase/find-selections.uc';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { createQueryBuilderMock } from './helpers';

describe('FindSelectionsUc', () => {
  const build = (): { uc: FindSelectionsUc; selectionRepository: SelectionRepository } => {
    const selectionRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as SelectionRepository;
    return { uc: new FindSelectionsUc(selectionRepository), selectionRepository };
  };

  it('returns selections for a question ordered by order', async () => {
    const { uc, selectionRepository } = build();
    (selectionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getMany: [{ id: 's-1', key: 'sel_aura_visual', order: 1, question: { id: 'q-1' } }],
      }),
    );

    const result = await uc.execute({ questionId: 'q-1' });

    expect(result).toEqual([{ id: 's-1', key: 'sel_aura_visual', order: 1, questionId: 'q-1' }]);
  });

  it('rejects a missing questionId with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ questionId: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
