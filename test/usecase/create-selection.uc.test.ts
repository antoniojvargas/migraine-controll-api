import { CreateSelectionUc } from '@/usecase/create-selection.uc';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';

describe('CreateSelectionUc', () => {
  const build = (): {
    uc: CreateSelectionUc;
    selectionRepository: SelectionRepository;
    questionRepository: QuestionRepository;
  } => {
    const selectionRepository = { create: jest.fn() } as unknown as SelectionRepository;
    const questionRepository = { findOneBy: jest.fn() } as unknown as QuestionRepository;
    return {
      uc: new CreateSelectionUc(selectionRepository, questionRepository),
      selectionRepository,
      questionRepository,
    };
  };

  it('creates a selection for an existing choice question', async () => {
    const { uc, selectionRepository, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'onboarding_aura',
      type: 'single',
      order: 1,
    });
    (selectionRepository.create as jest.Mock).mockResolvedValue({ id: 's-1' });

    const result = await uc.execute({ questionId: 'q-1', key: 'sel_aura_visual', order: 1 });

    expect(result).toEqual({ id: 's-1', key: 'sel_aura_visual', order: 1, questionId: 'q-1' });
    expect(selectionRepository.create).toHaveBeenCalledWith({
      question: { id: 'q-1' },
      key: 'sel_aura_visual',
      order: 1,
    });
  });

  it('rejects with 404 when the question does not exist', async () => {
    const { uc, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(
      uc.execute({ questionId: 'q-1', key: 'sel_aura_visual', order: 1 }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'QUESTION_NOT_FOUND' });
  });

  it('rejects with 400 when the question is a text question', async () => {
    const { uc, questionRepository } = build();
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'onboarding_notes',
      type: 'text',
      order: 1,
    });

    await expect(uc.execute({ questionId: 'q-1', key: 'sel-1', order: 1 })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
