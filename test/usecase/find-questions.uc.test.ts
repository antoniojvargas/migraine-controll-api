import { FindQuestionsUc } from '@/usecase/find-questions.uc';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { createQueryBuilderMock } from './helpers';

describe('FindQuestionsUc', () => {
  const build = (): { uc: FindQuestionsUc; questionRepository: QuestionRepository } => {
    const questionRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as QuestionRepository;
    return { uc: new FindQuestionsUc(questionRepository), questionRepository };
  };

  it('returns all questions when no filters are given', async () => {
    const { uc, questionRepository } = build();
    (questionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getMany: [{ id: 'q-1', key: 'onboarding_aura', type: 'single', order: 1 }],
      }),
    );

    const result = await uc.execute({});

    expect(result).toEqual([{ id: 'q-1', key: 'onboarding_aura', type: 'single', order: 1 }]);
  });

  it('filters by type and key', async () => {
    const { uc, questionRepository } = build();
    const queryBuilder = createQueryBuilderMock({
      getMany: [{ id: 'q-1', key: 'onboarding_aura', type: 'single', order: 1 }],
    });
    (questionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

    await uc.execute({ type: 'single', key: 'onboarding_aura' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('question.type = :type', {
      type: 'single',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('question.key = :key', {
      key: 'onboarding_aura',
    });
  });

  it('rejects an invalid type with 400', async () => {
    const { uc, questionRepository } = build();
    (questionRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [] }),
    );

    await expect(uc.execute({ type: 'bogus' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
