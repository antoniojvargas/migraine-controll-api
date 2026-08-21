import { DataSource } from 'typeorm';
import { NewTranslationSeeder } from '@/infra/database/seeds/new-translation.seeder';
import { NewTranslationEntity } from '@/infra/database/entities';
import translationsJson from '@/infra/database/seeds/data/new-translations.json';

describe('NewTranslationSeeder', () => {
  const build = (existingPairs: string[], options: { missingSelectionKey?: string } = {}) => {
    const translationRepository = {
      findOneBy: jest.fn(async (criteria: { selection: { id: string }; languageCode: string }) =>
        existingPairs.includes(`${criteria.selection.id}|${criteria.languageCode}`)
          ? { id: 't-existing' }
          : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const selectionRepository = {
      findOneBy: jest.fn(async (criteria: { key: string }) =>
        criteria.key === options.missingSelectionKey
          ? null
          : { id: `s-${criteria.key}`, key: criteria.key },
      ),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn((entity: unknown) =>
        entity === NewTranslationEntity ? translationRepository : selectionRepository,
      ),
    } as unknown as DataSource;
    return {
      seeder: new NewTranslationSeeder(),
      dataSource,
      translationRepository,
      selectionRepository,
    };
  };

  it('seeds every language for each selection with the parent resolved by key', async () => {
    const { seeder, dataSource, translationRepository, selectionRepository } = build([]);

    await seeder.run(dataSource);

    expect(
      (selectionRepository.findOneBy as jest.Mock).mock.calls.filter(
        ([criteria]) => (criteria as { key: string }).key === 'sel_aura_visual',
      ),
    ).toHaveLength(1);
    const inserted = (translationRepository.save as jest.Mock).mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(inserted).toHaveLength(translationsJson.length);
    expect(inserted[0]).toMatchObject({
      selection: { id: 's-sel_aura_visual' },
      languageCode: 'en',
      text: 'Visual aura',
    });
  });

  it('skips translations that already exist per (selection, language)', async () => {
    const { seeder, dataSource, translationRepository } = build(['s-sel_aura_visual|en']);

    await seeder.run(dataSource);

    const inserted = (translationRepository.save as jest.Mock).mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(inserted).toHaveLength(translationsJson.length - 1);
  });

  it('does not insert anything when everything already exists', async () => {
    const allPairs = ['s-sel_aura_visual|en', 's-sel_aura_visual|fr', 's-sel_aura_visual|es', '*'];
    const { seeder, dataSource, translationRepository } = build(allPairs);
    (translationRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 't-any' });

    await seeder.run(dataSource);

    expect(translationRepository.save).not.toHaveBeenCalled();
  });

  it('throws a descriptive error when the parent selection does not exist', async () => {
    const { seeder, dataSource } = build([], { missingSelectionKey: 'sel_aura_visual' });

    await expect(seeder.run(dataSource)).rejects.toThrow(
      '[seed:new_translations] selection "sel_aura_visual" not found',
    );
  });
});
