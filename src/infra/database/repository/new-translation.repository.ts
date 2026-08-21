import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { NewTranslationEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class NewTranslationRepository implements RepositoryInterface<NewTranslationEntity> {
  constructor(private readonly repository: Repository<NewTranslationEntity>) {}

  async create(data: DeepPartial<NewTranslationEntity>): Promise<NewTranslationEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<NewTranslationEntity> | FindOptionsWhere<NewTranslationEntity>[],
  ): Promise<NewTranslationEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<NewTranslationEntity> | FindOptionsWhere<NewTranslationEntity>[],
  ): Promise<NewTranslationEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<NewTranslationEntity>,
    data: DeepPartial<NewTranslationEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<NewTranslationEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
