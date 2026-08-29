import { DeepPartial } from 'typeorm';
import { UserResponseEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class UserResponseRepository extends BaseRepository<UserResponseEntity> {
  async bulkCreate(data: DeepPartial<UserResponseEntity>[]): Promise<UserResponseEntity[]> {
    return this.repository.save(this.repository.create(data));
  }
}
