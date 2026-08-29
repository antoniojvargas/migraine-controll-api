import { DeepPartial } from 'typeorm';
import { UserDailyVitalsEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class UserDailyVitalsRepository extends BaseRepository<UserDailyVitalsEntity> {
  async upsertByUserAndDate(
    data: DeepPartial<UserDailyVitalsEntity> & { user: { id: string }; dateLocal: string },
  ): Promise<void> {
    await this.repository.upsert(data, ['user', 'dateLocal']);
  }
}
