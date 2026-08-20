import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { TranslationEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class TranslationRepository implements RepositoryInterface<TranslationEntity> {
  constructor(private readonly repository: Repository<TranslationEntity>) {}

  async create(data: DeepPartial<TranslationEntity>): Promise<TranslationEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<TranslationEntity> | FindOptionsWhere<TranslationEntity>[],
  ): Promise<TranslationEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<TranslationEntity> | FindOptionsWhere<TranslationEntity>[],
  ): Promise<TranslationEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<TranslationEntity>,
    data: DeepPartial<TranslationEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<TranslationEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
