import { DataSource } from 'typeorm';
import { NewQuestionSeeder } from '@/infra/database/seeds/new-question.seeder';
import { NewQuestionEntity } from '@/infra/database/entities';
import questionsJson from '@/infra/database/seeds/data/new-questions.json';

describe('NewQuestionSeeder', () => {
  const build = (existingKeys: string[]) => {
    const questionRepository = {
      findOneBy: jest.fn(async (criteria: { key: string }) =>
        existingKeys.includes(criteria.key) ? { id: `q-${criteria.key}`, ...criteria } : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn((entity: unknown) =>
        entity === NewQuestionEntity ? questionRepository : {},
      ),
    } as unknown as DataSource;
    return { seeder: new NewQuestionSeeder(), dataSource, questionRepository };
  };

  it('seeds the full question set when the table is empty', async () => {
    const { seeder, dataSource, questionRepository } = build([]);

    await seeder.run(dataSource);

    expect(questionRepository.save).toHaveBeenCalledTimes(1);
    expect(questionRepository.create).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ key: 'onboarding_aura', type: 'single', order: 1 }),
        expect.objectContaining({ key: 'migraine_notes', type: 'text', order: 7 }),
      ]),
    );
    const inserted = (questionRepository.save as jest.Mock).mock.calls[0][0] as unknown[];
    expect(inserted).toHaveLength(questionsJson.length);
  });

  it('skips existing questions and only inserts the missing ones', async () => {
    const { seeder, dataSource, questionRepository } = build(['onboarding_aura']);

    await seeder.run(dataSource);

    const inserted = (questionRepository.save as jest.Mock).mock.calls[0][0] as unknown[];
    expect(inserted).toHaveLength(questionsJson.length - 1);
    expect(
      (questionRepository.create as jest.Mock).mock.calls[0][0] as Array<{ key: string }>,
    ).not.toContainEqual(expect.objectContaining({ key: 'onboarding_aura' }));
  });

  it('does not insert anything when every question already exists', async () => {
    const allKeys = (questionsJson as { key: string }[]).map((question) => question.key);
    const { seeder, dataSource, questionRepository } = build(allKeys);

    await seeder.run(dataSource);

    expect(questionRepository.save).not.toHaveBeenCalled();
  });
});
