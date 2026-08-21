import { FindOnboardingQuestionaryFormUc } from '@/usecase/find-onboarding-questionary-form.uc';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';

describe('FindOnboardingQuestionaryFormUc', () => {
  const build = (questionsResult: unknown) => {
    const questionQuery = {
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(questionsResult),
    };
    const selectionQuery = { ...questionQuery, getMany: jest.fn().mockResolvedValue([]) };
    const userResponseRepository = {
      findAllBy: jest.fn().mockResolvedValue([]),
    } as unknown as UserResponseRepository;
    const uc = new FindOnboardingQuestionaryFormUc(
      {
        createQueryBuilder: jest.fn().mockReturnValue(questionQuery),
      } as unknown as QuestionRepository,
      {
        createQueryBuilder: jest.fn().mockReturnValue(selectionQuery),
      } as unknown as SelectionRepository,
      userResponseRepository,
    );
    return { uc, questionQuery };
  };

  it('returns the single forms@ form matching the prefixed key', async () => {
    const { uc, questionQuery } = build([
      { id: 'q-1', key: 'forms@aura', type: 'single', order: 1 },
    ]);

    const result = await uc.execute({ userId: 'u-1', key: 'aura' });

    expect(questionQuery.andWhere).toHaveBeenCalledWith('question.key = :fullKey', {
      fullKey: 'forms@aura',
    });
    expect(result).toMatchObject({
      id: 'q-1',
      key: 'forms@aura',
      value: null,
      selections: [],
    });
  });

  it('returns null when the form does not exist in the category', async () => {
    const { uc } = build([]);

    const result = await uc.execute({ userId: 'u-1', key: 'missing' });

    expect(result).toBeNull();
  });
});
