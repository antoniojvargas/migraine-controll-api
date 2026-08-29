import { FindOptionsWhere } from 'typeorm';
import { PushNotificationTokenEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class PushNotificationTokenRepository extends BaseRepository<PushNotificationTokenEntity> {
  async delete(
    criteria:
      | FindOptionsWhere<PushNotificationTokenEntity>
      | FindOptionsWhere<PushNotificationTokenEntity>[],
  ): Promise<void> {
    await this.repository.delete(criteria);
  }
}
