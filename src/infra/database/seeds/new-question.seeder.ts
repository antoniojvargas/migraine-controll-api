import { DeepPartial, DataSource } from 'typeorm';
import { NewQuestionEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';
import questionsJson from './data/new-questions.json';

interface QuestionSeed {
  key: string;
  type: string;
  order: number;
}

const QUESTIONS = questionsJson as QuestionSeed[];

export class NewQuestionSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(NewQuestionEntity);
    const pending: DeepPartial<NewQuestionEntity>[] = [];
    for (const item of QUESTIONS) {
      const existing = await repository.findOneBy({ key: item.key });
      if (existing !== null) {
        continue;
      }
      pending.push({ key: item.key, type: item.type, order: item.order });
    }
    return seedData(dataSource, NewQuestionEntity, pending, 'new_questions');
  }
}
