import { FindOptionsWhere } from 'typeorm';
import { UserEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<UserEntity> {
  async softDelete(criteria: FindOptionsWhere<UserEntity>): Promise<void> {
    await this.repository.softDelete(criteria);
  }
}
