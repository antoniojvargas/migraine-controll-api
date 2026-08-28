import { CreateQuestionUc } from '@/usecase/create-question.uc';
import { QuestionRepository } from '@/infra/database/repository/question.repository';

describe('CreateQuestionUc', () => {
  const build = (): { uc: CreateQuestionUc; questionRepository: QuestionRepository } => {
    const questionRepository = { create: jest.fn() } as unknown as QuestionRepository;
    return { uc: new CreateQuestionUc(questionRepository), questionRepository };
  };

  it('creates a question and returns the output', async () => {
    const { uc, questionRepository } = build();
    (questionRepository.create as jest.Mock).mockResolvedValue({ id: 'q-1' });

    const result = await uc.execute({ key: 'onboarding_aura', type: 'single', order: 1 });

    expect(result).toEqual({ id: 'q-1', key: 'onboarding_aura', type: 'single', order: 1 });
    expect(questionRepository.create).toHaveBeenCalledWith({
      key: 'onboarding_aura',
      type: 'single',
      order: 1,
    });
  });

  it('rejects an invalid type with 400', async () => {
    const { uc } = build();

    await expect(
      uc.execute({ key: 'onboarding_aura', type: 'bogus', order: 1 }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });
});
