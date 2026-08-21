import { DeepPartial, DataSource } from 'typeorm';
import {
  PreferredAnswersEntity,
  QuestionEntity,
  SelectionEntity,
  UserEntity,
} from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';

interface PreferredAnswerSeed {
  userEmail: string;
  questionKey: string;
  selectionKey?: string;
  answerText?: string;
}

const DEV_PREFERRED_ANSWERS: PreferredAnswerSeed[] = [
  {
    userEmail: 'dev-user-a@migraine.local',
    questionKey: 'forms@aura',
    selectionKey: 'visual',
  },
  {
    userEmail: 'dev-user-a@migraine.local',
    questionKey: 'forms@notes',
    answerText: 'Prefiero notas breves',
  },
];

export class PreferredAnswersSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(PreferredAnswersEntity);
    const userRepository = dataSource.getRepository(UserEntity);
    const questionRepository = dataSource.getRepository(QuestionEntity);
    const selectionRepository = dataSource.getRepository(SelectionEntity);
    const pending: DeepPartial<PreferredAnswersEntity>[] = [];

    for (const item of DEV_PREFERRED_ANSWERS) {
      const user = await this.resolveBy(
        userRepository.findOneBy({ email: item.userEmail }),
        `user "${item.userEmail}"`,
      );
      const question = await this.resolveBy(
        questionRepository.findOneBy({ key: item.questionKey }),
        `question "${item.questionKey}"`,
      );
      let selectionId: string | undefined;
      if (item.selectionKey !== undefined) {
        const selection = await this.resolveBy(
          selectionRepository.findOneBy({ key: item.selectionKey }),
          `selection "${item.selectionKey}"`,
        );
        selectionId = selection.id;
      }
      const existing = await repository.findOneBy({
        user: { id: user.id },
        question: { id: question.id },
      });
      if (existing !== null) {
        continue;
      }
      pending.push({
        user: { id: user.id },
        question: { id: question.id },
        selection: selectionId !== undefined ? { id: selectionId } : undefined,
        answerText: item.answerText ?? null,
      });
    }

    return seedData(dataSource, PreferredAnswersEntity, pending, 'preferred_answers');
  }

  private async resolveBy<T extends { id: string }>(
    lookup: Promise<T | null>,
    description: string,
  ): Promise<T> {
    const entity = await lookup;
    if (entity === null) {
      throw new Error(`[seed:preferred_answers] ${description} not found`);
    }
    return entity;
  }
}
