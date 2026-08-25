import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { UserDailyVitalsEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class UserDailyVitalsRepository implements RepositoryInterface<UserDailyVitalsEntity> {
  constructor(private readonly repository: Repository<UserDailyVitalsEntity>) {}

  async create(data: DeepPartial<UserDailyVitalsEntity>): Promise<UserDailyVitalsEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<UserDailyVitalsEntity> | FindOptionsWhere<UserDailyVitalsEntity>[],
  ): Promise<UserDailyVitalsEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<UserDailyVitalsEntity> | FindOptionsWhere<UserDailyVitalsEntity>[],
  ): Promise<UserDailyVitalsEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<UserDailyVitalsEntity>,
    data: DeepPartial<UserDailyVitalsEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<UserDailyVitalsEntity> {
    return this.repository.createQueryBuilder(alias);
  }

  async upsertByUserAndDate(
    data: DeepPartial<UserDailyVitalsEntity> & { user: { id: string }; dateLocal: string },
  ): Promise<void> {
    await this.repository.upsert(data, ['user', 'dateLocal']);
  }
}
