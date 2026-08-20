import { CreatePreventiveTreatmentUc } from '@/usecase/create-preventive-treatment.uc';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { createQueryBuilderMock } from './helpers';

const future = (): Date => new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);

interface Mocks {
  uc: CreatePreventiveTreatmentUc;
  preventiveTreatmentRepository: PreventiveTreatmentRepository;
  preferredAnswersRepository: PreferredAnswersRepository;
  userResponseRepository: UserResponseRepository;
  questionRepository: QuestionRepository;
  selectionRepository: SelectionRepository;
  translationRepository: TranslationRepository;
}

describe('CreatePreventiveTreatmentUc', () => {
  const build = (): Mocks => {
    const preventiveTreatmentRepository = {
      create: jest.fn(),
    } as unknown as PreventiveTreatmentRepository;
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
    const uc = new CreatePreventiveTreatmentUc(
      preventiveTreatmentRepository,
      preferredAnswersRepository,
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
    );
    return {
      uc,
      preventiveTreatmentRepository,
      preferredAnswersRepository,
      userResponseRepository,
      questionRepository,
    };
  };

  it('creates the treatment and processes responses', async () => {
    const {
      uc,
      preventiveTreatmentRepository,
      questionRepository,
      userResponseRepository,
      preferredAnswersRepository,
    } = build();
    (preventiveTreatmentRepository.create as jest.Mock).mockResolvedValue({ id: 't-1' });
    (questionRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'q-1',
      key: 'trigger',
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
      userId: 'u-1',
      name: 'Amitriptilina',
      isRecurrent: true,
      repeatUntil: future(),
      responses: [{ questionId: 'q-1', answerId: 'sel-1' }],
    });

    expect(result).toMatchObject({
      id: 't-1',
      userId: 'u-1',
      name: 'Amitriptilina',
      isRecurrent: true,
    });
    expect(result.responses[0]).toMatchObject({
      questionId: 'q-1',
      selectionId: 'sel-1',
      preventiveTreatmentId: 't-1',
    });
    expect(preferredAnswersRepository.create).toHaveBeenCalledWith({
      user: { id: 'u-1' },
      question: { id: 'q-1' },
      selection: { id: 'sel-1' },
      answerText: null,
    });
  });

  it('creates a non-recurrent treatment without responses', async () => {
    const { uc, preventiveTreatmentRepository, userResponseRepository } = build();
    (preventiveTreatmentRepository.create as jest.Mock).mockResolvedValue({ id: 't-2' });
    (userResponseRepository.bulkCreate as jest.Mock).mockResolvedValue([]);

    const result = await uc.execute({ userId: 'u-1', name: 'Magnesio' });

    expect(result).toMatchObject({
      id: 't-2',
      name: 'Magnesio',
      isRecurrent: false,
      repeatUntil: null,
    });
    expect(result.responses).toEqual([]);
  });

  it('rejects repeatUntil without isRecurrent', async () => {
    const { uc } = build();

    await expect(
      uc.execute({ userId: 'u-1', name: 'X', repeatUntil: future() }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });
});
