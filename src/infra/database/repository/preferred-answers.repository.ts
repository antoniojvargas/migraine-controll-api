import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { PreferredAnswersEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class PreferredAnswersRepository implements RepositoryInterface<PreferredAnswersEntity> {
  constructor(private readonly repository: Repository<PreferredAnswersEntity>) {}

  async create(data: DeepPartial<PreferredAnswersEntity>): Promise<PreferredAnswersEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<PreferredAnswersEntity> | FindOptionsWhere<PreferredAnswersEntity>[],
  ): Promise<PreferredAnswersEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<PreferredAnswersEntity> | FindOptionsWhere<PreferredAnswersEntity>[],
  ): Promise<PreferredAnswersEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<PreferredAnswersEntity>,
    data: DeepPartial<PreferredAnswersEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<PreferredAnswersEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
