import { FindOnboardingQuestionaryNewFormsUc } from '@/usecase/find-onboarding-questionary-new-forms.uc';
import { NewQuestionRepository } from '@/infra/database/repository/new-question.repository';
import { NewSelectionRepository } from '@/infra/database/repository/new-selection.repository';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';

interface Mocks {
  uc: FindOnboardingQuestionaryNewFormsUc;
  questionRepository: { createQueryBuilder: jest.Mock };
  selectionRepository: { createQueryBuilder: jest.Mock };
  userResponseRepository: { findAllBy: jest.Mock };
}

const buildQueryBuilderMock = (getManyResult: unknown) => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(getManyResult),
  };
  const createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
  return { createQueryBuilder, queryBuilder };
};

describe('FindOnboardingQuestionaryNewFormsUc', () => {
  const build = (): Mocks => {
    const questions = buildQueryBuilderMock([
      { id: 'q-1', key: 'aura', type: 'single', order: 1 },
      { id: 'q-2', key: 'notes', type: 'text', order: 2 },
    ]);
    const selections = buildQueryBuilderMock([
      {
        id: 'sel-1',
        key: 'visual',
        order: 1,
        value: null,
        isCustom: false,
        question: { id: 'q-1' },
        translations: [
          { languageCode: 'en', text: 'Visual aura' },
          { languageCode: 'fr', text: 'Aura visuelle' },
          { languageCode: 'es', text: 'Aura visual' },
        ],
      },
      {
        id: 'custom-1',
        key: 'other-abc',
        order: 2,
        value: 'Calor',
        isCustom: true,
        question: { id: 'q-1' },
        translations: [],
      },
    ]);
    const questionRepository = {
      createQueryBuilder: questions.createQueryBuilder,
    } as unknown as NewQuestionRepository;
    const selectionRepository = {
      createQueryBuilder: selections.createQueryBuilder,
    } as unknown as NewSelectionRepository;
    const userResponseRepository = {
      findAllBy: jest.fn(),
    } as unknown as NewUserResponseRepository;
    const uc = new FindOnboardingQuestionaryNewFormsUc(
      questionRepository,
      selectionRepository,
      userResponseRepository,
    );
    return { uc, questionRepository, selectionRepository, userResponseRepository };
  };

  it('builds the form with en/fr translations marking previous responses', async () => {
    const { uc, userResponseRepository, selectionRepository } = build();
    (userResponseRepository.findAllBy as jest.Mock).mockResolvedValue([
      { selection: { id: 'custom-1' }, answerText: null, question: undefined },
      { selection: null, answerText: 'Mi nota previa', question: { id: 'q-2' } },
    ]);

    const result = await uc.execute({ userId: 'u-1' });

    expect(userResponseRepository.findAllBy).toHaveBeenCalledWith({ user: { id: 'u-1' } });
    expect((selectionRepository.createQueryBuilder as jest.Mock).mock.calls[0][0]).toBe(
      'selection',
    );
    expect(result).toHaveLength(2);

    const [auraQuestion, notesQuestion] = result;
    expect(auraQuestion.selections).toHaveLength(2);
    expect(auraQuestion.value).toBeNull();

    const visual = auraQuestion.selections[0];
    expect(visual.isSelected).toBe(false);
    expect(visual.translations).toEqual([
      { languageCode: 'en', text: 'Visual aura' },
      { languageCode: 'fr', text: 'Aura visuelle' },
    ]);

    const custom = auraQuestion.selections[1];
    expect(custom).toMatchObject({
      id: 'custom-1',
      isCustom: true,
      isSelected: true,
      value: 'Calor',
    });

    expect(notesQuestion.selections).toEqual([]);
    expect(notesQuestion.value).toBe('Mi nota previa');
  });

  it('returns an empty form when there are no questions', async () => {
    const { uc } = build();
    const emptyQuestions = buildQueryBuilderMock([]);
    (
      uc as unknown as { questionRepository: { createQueryBuilder: jest.Mock } }
    ).questionRepository.createQueryBuilder.mockImplementationOnce(
      emptyQuestions.createQueryBuilder,
    );

    const result = await uc.execute({ userId: 'u-1' });

    expect(result).toEqual([]);
  });

  it('rejects an empty userId', async () => {
    const { uc } = build();
    await expect(uc.execute({ userId: '  ' })).rejects.toMatchObject({
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
