import { Between, DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { TerraWebhookLogEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class TerraWebhookLogRepository implements RepositoryInterface<TerraWebhookLogEntity> {
  constructor(private readonly repository: Repository<TerraWebhookLogEntity>) {}

  async create(data: DeepPartial<TerraWebhookLogEntity>): Promise<TerraWebhookLogEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<TerraWebhookLogEntity> | FindOptionsWhere<TerraWebhookLogEntity>[],
  ): Promise<TerraWebhookLogEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<TerraWebhookLogEntity> | FindOptionsWhere<TerraWebhookLogEntity>[],
  ): Promise<TerraWebhookLogEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<TerraWebhookLogEntity>,
    data: DeepPartial<TerraWebhookLogEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<TerraWebhookLogEntity> {
    return this.repository.createQueryBuilder(alias);
  }

  // Uses TypeORM's Between() FindOperator instead of Mongo-style { $gte, $lte }
  // criteria, which TypeORM silently ignores (the bug found in the original project).
  findByReceivedAtRange(from: Date, to: Date): Promise<TerraWebhookLogEntity[]> {
    return this.repository.findBy({ receivedAt: Between(from, to) });
  }
}
