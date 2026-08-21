import { DataSource } from 'typeorm';
import {
  PreferredAnswersEntity,
  QuestionEntity,
  SelectionEntity,
  UserEntity,
} from '@/infra/database/entities';
import { PreferredAnswersSeeder } from '@/infra/database/seeds/preferredAnswers.seeder';

describe('PreferredAnswersSeeder', () => {
  const build = (
    existingPairs: string[],
    missing: { selectionKey?: boolean; questionKey?: boolean } = {},
  ) => {
    const preferredAnswersRepository = {
      findOneBy: jest.fn(async (criteria: { user: { id: string }; question: { id: string } }) =>
        existingPairs.includes(`${criteria.user.id}|${criteria.question.id}`)
          ? ({ id: 'pa-1' } as PreferredAnswersEntity)
          : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const userRepository = {
      findOneBy: jest.fn(async () => ({ id: 'u-a' }) as UserEntity),
    };
    const questionRepository = {
      findOneBy: jest.fn(async (criteria: { key: string }) =>
        !missing.questionKey ? ({ id: `q-${criteria.key}`, ...criteria } as QuestionEntity) : null,
      ),
    };
    const selectionRepository = {
      findOneBy: jest.fn(async (criteria: { key: string }) =>
        !missing.selectionKey ? ({ id: 's-1', ...criteria } as SelectionEntity) : null,
      ),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn((entity: unknown) => {
        if (entity === PreferredAnswersEntity) return preferredAnswersRepository;
        if (entity === UserEntity) return userRepository;
        if (entity === QuestionEntity) return questionRepository;
        return selectionRepository;
      }),
    } as unknown as DataSource;
    return { seeder: new PreferredAnswersSeeder(), dataSource, preferredAnswersRepository };
  };

  it('seeds preferred answers resolving user, question and selection', async () => {
    const { seeder, dataSource, preferredAnswersRepository } = build([]);

    await seeder.run(dataSource);

    const inserted = (preferredAnswersRepository.save as jest.Mock).mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(inserted).toEqual([
      {
        user: { id: 'u-a' },
        question: { id: 'q-forms@aura' },
        selection: { id: 's-1' },
        answerText: null,
      },
      {
        user: { id: 'u-a' },
        question: { id: 'q-forms@notes' },
        selection: undefined,
        answerText: 'Prefiero notas breves',
      },
    ]);
  });

  it('skips pairs that already exist for the user', async () => {
    const { seeder, dataSource, preferredAnswersRepository } = build(['u-a|q-forms@aura']);

    await seeder.run(dataSource);

    const inserted = (preferredAnswersRepository.save as jest.Mock).mock.calls[0][0] as unknown[];
    expect(inserted).toHaveLength(1);
  });

  it('throws a descriptive error when the referenced selection is missing', async () => {
    const { seeder, dataSource } = build([], { selectionKey: true });

    await expect(seeder.run(dataSource)).rejects.toThrow(
      '[seed:preferred_answers] selection "visual" not found',
    );
  });
});
