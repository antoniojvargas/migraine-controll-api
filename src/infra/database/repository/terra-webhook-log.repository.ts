import { Between } from 'typeorm';
import { TerraWebhookLogEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class TerraWebhookLogRepository extends BaseRepository<TerraWebhookLogEntity> {
  // Uses TypeORM's Between() FindOperator instead of Mongo-style { $gte, $lte }
  // criteria, which TypeORM silently ignores (the bug found in the original project).
  findByReceivedAtRange(from: Date, to: Date): Promise<TerraWebhookLogEntity[]> {
    return this.repository.findBy({ receivedAt: Between(from, to) });
  }
}
