import { DataSource } from 'typeorm';
import { NewSelectionSeeder } from '@/infra/database/seeds/new-selection.seeder';
import { NewSelectionEntity } from '@/infra/database/entities';
import selectionsJson from '@/infra/database/seeds/data/new-selections.json';

describe('NewSelectionSeeder', () => {
  const build = (existingKeys: string[], options: { missingQuestionKey?: string } = {}) => {
    const selectionRepository = {
      findOneBy: jest.fn(async (criteria: { key: string }) =>
        existingKeys.includes(criteria.key) ? { id: `s-${criteria.key}`, ...criteria } : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const questionRepository = {
      findOneBy: jest.fn(async (criteria: { key: string }) =>
        criteria.key === options.missingQuestionKey
          ? null
          : { id: `q-${criteria.key}`, ...criteria },
      ),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn((entity: unknown) =>
        entity === NewSelectionEntity ? selectionRepository : questionRepository,
      ),
    } as unknown as DataSource;
    return { seeder: new NewSelectionSeeder(), dataSource, selectionRepository };
  };

  it('seeds all selections resolving the parent question by key once per question', async () => {
    const { seeder, dataSource, selectionRepository } = build([]);

    await seeder.run(dataSource);

    const inserted = (selectionRepository.save as jest.Mock).mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(inserted).toHaveLength(selectionsJson.length);
    expect(inserted[0]).toMatchObject({
      question: { id: 'q-onboarding_aura' },
      key: 'sel_aura_visual',
      order: 1,
      value: null,
      isCustom: false,
    });
  });

  it('skips existing selections and only inserts the missing ones', async () => {
    const { seeder, dataSource, selectionRepository } = build(['sel_aura_visual']);

    await seeder.run(dataSource);

    const inserted = (selectionRepository.save as jest.Mock).mock.calls[0][0] as unknown[];
    expect(inserted).toHaveLength(selectionsJson.length - 1);
  });

  it('throws a descriptive error when the parent question does not exist', async () => {
    const { seeder, dataSource } = build([], { missingQuestionKey: 'onboarding_aura' });

    await expect(seeder.run(dataSource)).rejects.toThrow(
      '[seed:new_selections] question "onboarding_aura" not found',
    );
  });
});
