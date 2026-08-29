import { DeepPartial } from 'typeorm';
import { SessionEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class SessionRepository extends BaseRepository<SessionEntity> {
  async bulkCreate(data: DeepPartial<SessionEntity>[]): Promise<SessionEntity[]> {
    return this.repository.save(this.repository.create(data));
  }
}
