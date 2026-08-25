import {
  Between,
  DeepPartial,
  FindOptionsWhere,
  QueryDeepPartialEntity,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { TerraHealthDataEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class TerraHealthDataRepository implements RepositoryInterface<TerraHealthDataEntity> {
  constructor(private readonly repository: Repository<TerraHealthDataEntity>) {}

  async create(data: DeepPartial<TerraHealthDataEntity>): Promise<TerraHealthDataEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<TerraHealthDataEntity> | FindOptionsWhere<TerraHealthDataEntity>[],
  ): Promise<TerraHealthDataEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<TerraHealthDataEntity> | FindOptionsWhere<TerraHealthDataEntity>[],
  ): Promise<TerraHealthDataEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<TerraHealthDataEntity>,
    data: DeepPartial<TerraHealthDataEntity>,
  ): Promise<void> {
    // `data` is a jsonb column typed as `unknown`, which TypeORM's QueryDeepPartialEntity
    // cannot map structurally; the cast is safe since data is already DeepPartial<TerraHealthDataEntity>.
    await this.repository.update(criteria, data as QueryDeepPartialEntity<TerraHealthDataEntity>);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<TerraHealthDataEntity> {
    return this.repository.createQueryBuilder(alias);
  }

  // Uses TypeORM's Between() FindOperator instead of Mongo-style { $gte, $lte }
  // criteria, which TypeORM silently ignores (the bug found in the original project).
  findByTerraUserAndPeriod(
    terraUserId: string,
    from: Date,
    to: Date,
  ): Promise<TerraHealthDataEntity[]> {
    return this.repository.findBy({
      terraUser: { id: terraUserId },
      periodStart: Between(from, to),
    });
  }
}
