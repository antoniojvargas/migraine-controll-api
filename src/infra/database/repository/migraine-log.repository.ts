import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { MigraineLogEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class MigraineLogRepository implements RepositoryInterface<MigraineLogEntity> {
  constructor(private readonly repository: Repository<MigraineLogEntity>) {}

  async create(data: DeepPartial<MigraineLogEntity>): Promise<MigraineLogEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<MigraineLogEntity> | FindOptionsWhere<MigraineLogEntity>[],
  ): Promise<MigraineLogEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<MigraineLogEntity> | FindOptionsWhere<MigraineLogEntity>[],
  ): Promise<MigraineLogEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<MigraineLogEntity>,
    data: DeepPartial<MigraineLogEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<MigraineLogEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
