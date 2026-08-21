import { FindOnboardingQuestionaryFormsUc } from '@/usecase/find-onboarding-questionary-forms.uc';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';

const buildQueryBuilder = (getManyResult: unknown) => {
  const queryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(getManyResult),
  };
  return {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    queryBuilder: queryBuilder as unknown as Record<string, jest.Mock>,
  };
};

describe('FindOnboardingQuestionaryFormsUc', () => {
  const build = () => {
    const questions = buildQueryBuilder([
      { id: 'q-1', key: 'forms@aura', type: 'single', order: 1 },
      { id: 'q-2', key: 'forms@notes', type: 'text', order: 2 },
    ]);
    const selections = buildQueryBuilder([
      {
        id: 'sel-1',
        key: 'visual',
        order: 1,
        question: { id: 'q-1' },
        translations: [
          { languageCode: 'en', text: 'Visual aura' },
          { languageCode: 'es', text: 'Aura visual' },
        ],
      },
      {
        id: 'sel-2',
        key: 'no_aura',
        order: 2,
        question: { id: 'q-1' },
        translations: [],
      },
    ]);
    const questionRepository = {
      createQueryBuilder: questions.createQueryBuilder,
    } as unknown as QuestionRepository;
    const selectionRepository = {
      createQueryBuilder: selections.createQueryBuilder,
    } as unknown as SelectionRepository;
    const userResponseRepository = {
      findAllBy: jest.fn(),
    } as unknown as UserResponseRepository;
    const uc = new FindOnboardingQuestionaryFormsUc(
      questionRepository,
      selectionRepository,
      userResponseRepository,
    );
    return {
      uc,
      userResponseRepository,
      questionQuery: questions.queryBuilder,
      selectionQuery: selections.queryBuilder,
    };
  };

  it('builds forms for the forms@ category marking previous responses', async () => {
    const { uc, userResponseRepository, questionQuery, selectionQuery } = build();
    (userResponseRepository.findAllBy as jest.Mock).mockResolvedValue([
      { selection: { id: 'sel-2' }, answerText: null, question: undefined },
      { selection: null, answerText: 'Nota previa', question: { id: 'q-2' } },
    ]);

    const result = await uc.execute({ userId: 'u-1' });

    expect(questionQuery.where).toHaveBeenCalledWith('question.key LIKE :prefix', {
      prefix: 'forms@%',
    });
    expect(questionQuery.andWhere).not.toHaveBeenCalled();
    expect(selectionQuery.where).toHaveBeenCalledWith(
      'selection.question_id IN (:...questionIds)',
      { questionIds: ['q-1', 'q-2'] },
    );
    expect(userResponseRepository.findAllBy).toHaveBeenCalledWith({ user: { id: 'u-1' } });

    expect(result).toEqual([
      {
        id: 'q-1',
        key: 'forms@aura',
        type: 'single',
        order: 1,
        value: null,
        selections: [
          {
            id: 'sel-1',
            key: 'visual',
            order: 1,
            isSelected: false,
            translations: [
              { languageCode: 'en', text: 'Visual aura' },
              { languageCode: 'es', text: 'Aura visual' },
            ],
          },
          {
            id: 'sel-2',
            key: 'no_aura',
            order: 2,
            isSelected: true,
            translations: [],
          },
        ],
      },
      {
        id: 'q-2',
        key: 'forms@notes',
        type: 'text',
        order: 2,
        value: 'Nota previa',
        selections: [],
      },
    ]);
  });

  it('returns an empty array when the category has no questions', async () => {
    const empty = buildQueryBuilder([]);
    const { uc } = build();
    (
      uc as unknown as { questionRepository: { createQueryBuilder: jest.Mock } }
    ).questionRepository.createQueryBuilder.mockImplementationOnce(empty.createQueryBuilder);

    const result = await uc.execute({ userId: 'u-1' });

    expect(result).toEqual([]);
  });
});
