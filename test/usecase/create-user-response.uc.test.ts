import { CreateUserResponseUc } from '@/usecase/create-user-response.uc';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';

interface Mocks {
  uc: CreateUserResponseUc;
  userResponseRepository: UserResponseRepository;
  questionRepository: QuestionRepository;
  selectionRepository: SelectionRepository;
  translationRepository: TranslationRepository;
}

describe('CreateUserResponseUc', () => {
  const build = (): Mocks => {
    const userResponseRepository = { create: jest.fn() } as unknown as UserResponseRepository;
    const questionRepository = { findOneBy: jest.fn() } as unknown as QuestionRepository;
    const selectionRepository = {
      findAllBy: jest.fn(),
      create: jest.fn(),
    } as unknown as SelectionRepository;
    const translationRepository = { create: jest.fn() } as unknown as TranslationRepository;
    const uc = new CreateUserResponseUc(
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
    );
    return {
      uc,
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
    };
  };

  it('persists an existing selection answer', async () => {
    const { uc, userResponseRepository, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'aura',
      type: 'single',
      order: 1,
    });
    (userResponseRepository.create as jest.Mock).mockResolvedValue({ id: 'r-1' });

    const result = await uc.execute({
      userId: 'u-1',
      questionId: 'q-1',
      answerId: 'sel-1',
      migraineLogId: 'ml-1',
    });

    expect(result).toMatchObject({
      id: 'r-1',
      userId: 'u-1',
      questionId: 'q-1',
      selectionId: 'sel-1',
      answerText: null,
      migraineLogId: 'ml-1',
    });
    expect(userResponseRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        question: { id: 'q-1' },
        selection: { id: 'sel-1' },
        migraineLog: { id: 'ml-1' },
      }),
    );
  });

  it('persists a text answer', async () => {
    const { uc, userResponseRepository, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-2',
      key: 'notes',
      type: 'text',
      order: 2,
    });
    (userResponseRepository.create as jest.Mock).mockResolvedValue({ id: 'r-1' });

    const result = await uc.execute({
      userId: 'u-1',
      questionId: 'q-2',
      answerText: 'Dolor en la nuca',
    });

    expect(result).toMatchObject({
      questionId: 'q-2',
      selectionId: null,
      answerText: 'Dolor en la nuca',
    });
  });

  it('creates a selection and translation for add-other answers', async () => {
    const {
      uc,
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
    } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'trigger',
      type: 'multiple',
      order: 1,
    });
    (userResponseRepository.create as jest.Mock).mockResolvedValue({ id: 'r-1' });
    (selectionRepository.findAllBy as jest.Mock).mockResolvedValue([{ order: 3 }]);
    (selectionRepository.create as jest.Mock).mockResolvedValue({ id: 'new-sel' });
    (translationRepository.create as jest.Mock).mockResolvedValue({ id: 't-1' });

    const result = await uc.execute({
      userId: 'u-1',
      questionId: 'q-1',
      answerText: 'Estrés',
      answerLanguageCode: 'es',
    });

    expect(result.selectionId).toBe('new-sel');
    expect(selectionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        question: { id: 'q-1' },
        key: expect.stringMatching(/^other-/),
        order: 4,
      }),
    );
    expect(translationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ selection: { id: 'new-sel' }, languageCode: 'es', text: 'Estrés' }),
    );
  });

  it('throws 404 for an unknown question', async () => {
    const { uc, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(
      uc.execute({ userId: 'u-1', questionId: 'nope', answerId: 'sel-1' }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'QUESTION_NOT_FOUND',
    });
  });

  it('requires a language code for custom answers', async () => {
    const { uc, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'trigger',
      type: 'multiple',
      order: 1,
    });

    await expect(
      uc.execute({ userId: 'u-1', questionId: 'q-1', answerText: 'Estrés' }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });
});
