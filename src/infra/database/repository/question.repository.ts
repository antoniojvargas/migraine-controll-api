import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { QuestionEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class QuestionRepository implements RepositoryInterface<QuestionEntity> {
  constructor(private readonly repository: Repository<QuestionEntity>) {}

  async create(data: DeepPartial<QuestionEntity>): Promise<QuestionEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<QuestionEntity> | FindOptionsWhere<QuestionEntity>[],
  ): Promise<QuestionEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<QuestionEntity> | FindOptionsWhere<QuestionEntity>[],
  ): Promise<QuestionEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<QuestionEntity>,
    data: DeepPartial<QuestionEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<QuestionEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
