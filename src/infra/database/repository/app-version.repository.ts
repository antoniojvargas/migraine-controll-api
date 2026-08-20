import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { AppVersionEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class AppVersionRepository implements RepositoryInterface<AppVersionEntity> {
  constructor(private readonly repository: Repository<AppVersionEntity>) {}

  async create(data: DeepPartial<AppVersionEntity>): Promise<AppVersionEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<AppVersionEntity> | FindOptionsWhere<AppVersionEntity>[],
  ): Promise<AppVersionEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<AppVersionEntity> | FindOptionsWhere<AppVersionEntity>[],
  ): Promise<AppVersionEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<AppVersionEntity>,
    data: DeepPartial<AppVersionEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<AppVersionEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
