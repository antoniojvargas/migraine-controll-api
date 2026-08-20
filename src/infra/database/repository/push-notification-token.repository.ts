import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { PushNotificationTokenEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class PushNotificationTokenRepository implements RepositoryInterface<PushNotificationTokenEntity> {
  constructor(private readonly repository: Repository<PushNotificationTokenEntity>) {}

  async create(
    data: DeepPartial<PushNotificationTokenEntity>,
  ): Promise<PushNotificationTokenEntity> {
    return this.repository.save(this.repository.create(data));
  }

  async delete(
    criteria:
      | FindOptionsWhere<PushNotificationTokenEntity>
      | FindOptionsWhere<PushNotificationTokenEntity>[],
  ): Promise<void> {
    await this.repository.delete(criteria);
  }

  findOneBy(
    criteria:
      | FindOptionsWhere<PushNotificationTokenEntity>
      | FindOptionsWhere<PushNotificationTokenEntity>[],
  ): Promise<PushNotificationTokenEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria:
      | FindOptionsWhere<PushNotificationTokenEntity>
      | FindOptionsWhere<PushNotificationTokenEntity>[],
  ): Promise<PushNotificationTokenEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<PushNotificationTokenEntity>,
    data: DeepPartial<PushNotificationTokenEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<PushNotificationTokenEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
