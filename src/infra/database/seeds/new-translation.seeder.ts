import { DeepPartial, DataSource } from 'typeorm';
import { NewSelectionEntity, NewTranslationEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';
import translationsJson from './data/new-translations.json';

interface TranslationSeed {
  selectionKey: string;
  languageCode: string;
  text: string;
}

const TRANSLATIONS = translationsJson as TranslationSeed[];

export class NewTranslationSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(NewTranslationEntity);
    const selectionRepository = dataSource.getRepository(NewSelectionEntity);
    const selectionCache = new Map<string, NewSelectionEntity>();
    const pending: DeepPartial<NewTranslationEntity>[] = [];

    for (const item of TRANSLATIONS) {
      const selection = await this.resolveSelection(
        selectionRepository,
        selectionCache,
        item.selectionKey,
      );
      const existing = await repository.findOneBy({
        selection: { id: selection.id },
        languageCode: item.languageCode,
      });
      if (existing !== null) {
        continue;
      }
      pending.push({
        selection: { id: selection.id },
        languageCode: item.languageCode,
        text: item.text,
      });
    }

    return seedData(dataSource, NewTranslationEntity, pending, 'new_translations');
  }

  private async resolveSelection(
    repository: { findOneBy(criteria: { key: string }): Promise<NewSelectionEntity | null> },
    cache: Map<string, NewSelectionEntity>,
    key: string,
  ): Promise<NewSelectionEntity> {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const selection = await repository.findOneBy({ key });
    if (selection === null) {
      throw new Error(`[seed:new_translations] selection "${key}" not found`);
    }
    cache.set(key, selection);
    return selection;
  }
}
