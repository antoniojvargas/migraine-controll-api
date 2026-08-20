import { CreateUserResponsesUc } from '@/usecase/create-user-responses.uc';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';

interface Mocks {
  uc: CreateUserResponsesUc;
  userResponseRepository: UserResponseRepository;
  questionRepository: QuestionRepository;
  selectionRepository: SelectionRepository;
  translationRepository: TranslationRepository;
}

describe('CreateUserResponsesUc', () => {
  const build = (): Mocks => {
    const userResponseRepository = { bulkCreate: jest.fn() } as unknown as UserResponseRepository;
    const questionRepository = { findOneBy: jest.fn() } as unknown as QuestionRepository;
    const selectionRepository = {
      findAllBy: jest.fn(),
      create: jest.fn(),
    } as unknown as SelectionRepository;
    const translationRepository = { create: jest.fn() } as unknown as TranslationRepository;
    const uc = new CreateUserResponsesUc(
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

  it('persists multiple responses reusing the question cache', async () => {
    const { uc, userResponseRepository, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'aura',
      type: 'single',
      order: 1,
    });
    (userResponseRepository.bulkCreate as jest.Mock).mockResolvedValue([
      { id: 'r-1' },
      { id: 'r-2' },
    ]);

    const result = await uc.execute({
      userId: 'u-1',
      migraineLogId: 'ml-1',
      responses: [
        { questionId: 'q-1', answerId: 'sel-1' },
        { questionId: 'q-1', answerId: 'sel-2' },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].selectionId).toBe('sel-1');
    expect(result[1].selectionId).toBe('sel-2');
    expect(questionRepository.findOneBy).toHaveBeenCalledTimes(1);
    expect(userResponseRepository.bulkCreate).toHaveBeenCalledTimes(1);
    const entities = (userResponseRepository.bulkCreate as jest.Mock).mock.calls[0][0] as unknown[];
    expect(entities).toHaveLength(2);
    expect(userResponseRepository.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          question: { id: 'q-1' },
          selection: { id: 'sel-1' },
          migraineLog: { id: 'ml-1' },
        }),
        expect.objectContaining({
          question: { id: 'q-1' },
          selection: { id: 'sel-2' },
          migraineLog: { id: 'ml-1' },
        }),
      ]),
    );
  });

  it('creates a custom selection inside a batch', async () => {
    const {
      uc,
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
    } = build();
    (questionRepository.findOneBy as jest.Mock).mockImplementation(
      async (criteria: { id: string }) =>
        criteria.id === 'q-1'
          ? { id: 'q-1', key: 'aura', type: 'single', order: 1 }
          : { id: 'q-2', key: 'trigger', type: 'multiple', order: 2 },
    );
    (userResponseRepository.bulkCreate as jest.Mock).mockResolvedValue([
      { id: 'r-1' },
      { id: 'r-2' },
    ]);
    (selectionRepository.findAllBy as jest.Mock).mockResolvedValue([]);
    (selectionRepository.create as jest.Mock).mockResolvedValue({ id: 'new-sel' });
    (translationRepository.create as jest.Mock).mockResolvedValue({ id: 't-1' });

    const result = await uc.execute({
      userId: 'u-1',
      responses: [
        { questionId: 'q-1', answerId: 'sel-1' },
        { questionId: 'q-2', answerText: 'Calor', answerLanguageCode: 'es' },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[1].selectionId).toBe('new-sel');
    expect(translationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ selection: { id: 'new-sel' }, languageCode: 'es', text: 'Calor' }),
    );
  });
});
