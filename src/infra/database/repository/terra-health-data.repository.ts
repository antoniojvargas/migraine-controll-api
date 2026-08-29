import { Between } from 'typeorm';
import { TerraHealthDataEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class TerraHealthDataRepository extends BaseRepository<TerraHealthDataEntity> {
  // `data` is a jsonb column typed as `unknown`; BaseRepository.update already
  // casts DeepPartial<T> to QueryDeepPartialEntity<T>, so no override is needed.

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
