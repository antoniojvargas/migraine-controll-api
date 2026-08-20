import { CreateMigraineLogUc } from '@/usecase/create-migraine-log.uc';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { createQueryBuilderMock } from './helpers';

const baseInput = (): {
  userId: string;
  sessionId: string;
  intensity: number;
  painLocation: string;
  startedAt: Date;
  endedAt: Date;
} => ({
  userId: 'u-1',
  sessionId: 'sess-1',
  intensity: 60,
  painLocation: 'frontal',
  startedAt: new Date(Date.now() - 7200000),
  endedAt: new Date(Date.now() - 3600000),
});

interface Mocks {
  uc: CreateMigraineLogUc;
  migraineLogRepository: MigraineLogRepository;
  preferredAnswersRepository: PreferredAnswersRepository;
  userResponseRepository: UserResponseRepository;
  questionRepository: QuestionRepository;
  selectionRepository: SelectionRepository;
  translationRepository: TranslationRepository;
}

describe('CreateMigraineLogUc', () => {
  const build = (): Mocks => {
    const migraineLogRepository = { create: jest.fn() } as unknown as MigraineLogRepository;
    const preferredAnswersRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
    } as unknown as PreferredAnswersRepository;
    const userResponseRepository = {
      bulkCreate: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as UserResponseRepository;
    const questionRepository = { findOneBy: jest.fn() } as unknown as QuestionRepository;
    const selectionRepository = {
      findAllBy: jest.fn(),
      create: jest.fn(),
    } as unknown as SelectionRepository;
    const translationRepository = { create: jest.fn() } as unknown as TranslationRepository;
    const uc = new CreateMigraineLogUc(
      migraineLogRepository,
      preferredAnswersRepository,
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
    );
    return {
      uc,
      migraineLogRepository,
      preferredAnswersRepository,
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
    };
  };

  it('creates the log, links the response and upserts the preferred answer', async () => {
    const {
      uc,
      migraineLogRepository,
      questionRepository,
      userResponseRepository,
      preferredAnswersRepository,
    } = build();
    (migraineLogRepository.create as jest.Mock).mockResolvedValue({ id: 'ml-1' });
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'aura',
      type: 'single',
      order: 1,
    });
    (userResponseRepository.bulkCreate as jest.Mock).mockResolvedValue([{ id: 'r-1' }]);
    (userResponseRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getRawMany: [] }),
    );
    (preferredAnswersRepository.findOneBy as jest.Mock).mockResolvedValue(null);
    (preferredAnswersRepository.create as jest.Mock).mockResolvedValue({});

    const result = await uc.execute({
      ...baseInput(),
      responses: [{ questionId: 'q-1', answerId: 'sel-1' }],
    });

    expect(result.id).toBe('ml-1');
    expect(result.sessionId).toBe('sess-1');
    expect(result.responses).toHaveLength(1);
    expect(result.responses[0]).toMatchObject({
      questionId: 'q-1',
      selectionId: 'sel-1',
      migraineLogId: 'ml-1',
    });
    expect(result.recurrentSymptoms).toEqual([]);
    expect(preferredAnswersRepository.create).toHaveBeenCalledWith({
      user: { id: 'u-1' },
      question: { id: 'q-1' },
      selection: { id: 'sel-1' },
      answerText: null,
    });
  });

  it('does not duplicate an existing preferred answer', async () => {
    const {
      uc,
      migraineLogRepository,
      questionRepository,
      userResponseRepository,
      preferredAnswersRepository,
    } = build();
    (migraineLogRepository.create as jest.Mock).mockResolvedValue({ id: 'ml-1' });
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'aura',
      type: 'single',
      order: 1,
    });
    (userResponseRepository.bulkCreate as jest.Mock).mockResolvedValue([{ id: 'r-1' }]);
    (userResponseRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getRawMany: [] }),
    );
    (preferredAnswersRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 'pa-1' });

    await uc.execute({ ...baseInput(), responses: [{ questionId: 'q-1', answerId: 'sel-1' }] });

    expect(preferredAnswersRepository.create).not.toHaveBeenCalled();
  });

  it('creates a selection and translation for add-other answers', async () => {
    const {
      uc,
      migraineLogRepository,
      questionRepository,
      userResponseRepository,
      preferredAnswersRepository,
      selectionRepository,
      translationRepository,
    } = build();
    (migraineLogRepository.create as jest.Mock).mockResolvedValue({ id: 'ml-1' });
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-2',
      key: 'trigger',
      type: 'multiple',
      order: 2,
    });
    (userResponseRepository.bulkCreate as jest.Mock).mockResolvedValue([{ id: 'r-1' }]);
    (userResponseRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getRawMany: [] }),
    );
    (preferredAnswersRepository.findOneBy as jest.Mock).mockResolvedValue(null);
    (preferredAnswersRepository.create as jest.Mock).mockResolvedValue({});
    (selectionRepository.findAllBy as jest.Mock).mockResolvedValue([]);
    (selectionRepository.create as jest.Mock).mockResolvedValue({ id: 'new-sel' });
    (translationRepository.create as jest.Mock).mockResolvedValue({ id: 't-1' });

    const result = await uc.execute({
      ...baseInput(),
      responses: [{ questionId: 'q-2', answerText: 'Estrés', answerLanguageCode: 'es' }],
    });

    expect(result.responses[0].selectionId).toBe('new-sel');
    expect(selectionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        question: { id: 'q-2' },
        key: expect.stringMatching(/^other-/),
        order: 0,
      }),
    );
    expect(translationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ selection: { id: 'new-sel' }, languageCode: 'es', text: 'Estrés' }),
    );
    expect(preferredAnswersRepository.create).toHaveBeenCalledWith({
      user: { id: 'u-1' },
      question: { id: 'q-2' },
      selection: { id: 'new-sel' },
      answerText: null,
    });
  });

  it('throws 404 for an unknown question', async () => {
    const { uc, migraineLogRepository, questionRepository } = build();
    (migraineLogRepository.create as jest.Mock).mockResolvedValue({ id: 'ml-1' });
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(
      uc.execute({ ...baseInput(), responses: [{ questionId: 'nope', answerId: 'sel-1' }] }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'QUESTION_NOT_FOUND' });
  });

  it('requires a language code for custom answers', async () => {
    const { uc, migraineLogRepository, questionRepository } = build();
    (migraineLogRepository.create as jest.Mock).mockResolvedValue({ id: 'ml-1' });
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-2',
      key: 'trigger',
      type: 'multiple',
      order: 2,
    });

    await expect(
      uc.execute({ ...baseInput(), responses: [{ questionId: 'q-2', answerText: 'Estrés' }] }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });

  it('reports recurrent symptoms with >= 5 occurrences', async () => {
    const {
      uc,
      migraineLogRepository,
      questionRepository,
      userResponseRepository,
      preferredAnswersRepository,
    } = build();
    (migraineLogRepository.create as jest.Mock).mockResolvedValue({ id: 'ml-1' });
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'aura',
      type: 'single',
      order: 1,
    });
    (userResponseRepository.bulkCreate as jest.Mock).mockResolvedValue([{ id: 'r-1' }]);
    (userResponseRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getRawMany: [{ selectionId: 'sel-1', answerText: null, occurrences: '5' }],
      }),
    );
    (preferredAnswersRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    const result = await uc.execute({
      ...baseInput(),
      responses: [{ questionId: 'q-1', answerId: 'sel-1' }],
    });

    expect(result.recurrentSymptoms).toEqual([
      { selectionId: 'sel-1', answerText: null, occurrences: 5 },
    ]);
  });
});
