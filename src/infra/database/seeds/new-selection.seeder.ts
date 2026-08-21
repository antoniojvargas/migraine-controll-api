import { DeepPartial, DataSource } from 'typeorm';
import { NewQuestionEntity, NewSelectionEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';
import selectionsJson from './data/new-selections.json';

interface SelectionSeed {
  key: string;
  questionKey: string;
  order: number;
  isCustom?: boolean;
}

const SELECTIONS = selectionsJson as SelectionSeed[];

export class NewSelectionSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(NewSelectionEntity);
    const questionRepository = dataSource.getRepository(NewQuestionEntity);
    const questionCache = new Map<string, NewQuestionEntity>();
    const pending: DeepPartial<NewSelectionEntity>[] = [];

    for (const item of SELECTIONS) {
      const existing = await repository.findOneBy({ key: item.key });
      if (existing !== null) {
        continue;
      }
      const question = await this.resolveQuestion(
        questionRepository,
        questionCache,
        item.questionKey,
      );
      pending.push({
        question: { id: question.id },
        key: item.key,
        order: item.order,
        value: null,
        isCustom: item.isCustom ?? false,
      });
    }

    return seedData(dataSource, NewSelectionEntity, pending, 'new_selections');
  }

  private async resolveQuestion(
    repository: { findOneBy(criteria: { key: string }): Promise<NewQuestionEntity | null> },
    cache: Map<string, NewQuestionEntity>,
    key: string,
  ): Promise<NewQuestionEntity> {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const question = await repository.findOneBy({ key });
    if (question === null) {
      throw new Error(`[seed:new_selections] question "${key}" not found`);
    }
    cache.set(key, question);
    return question;
  }
}
