import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { NewQuestionEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class NewQuestionRepository implements RepositoryInterface<NewQuestionEntity> {
  constructor(private readonly repository: Repository<NewQuestionEntity>) {}

  async create(data: DeepPartial<NewQuestionEntity>): Promise<NewQuestionEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<NewQuestionEntity> | FindOptionsWhere<NewQuestionEntity>[],
  ): Promise<NewQuestionEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<NewQuestionEntity> | FindOptionsWhere<NewQuestionEntity>[],
  ): Promise<NewQuestionEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<NewQuestionEntity>,
    data: DeepPartial<NewQuestionEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<NewQuestionEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
