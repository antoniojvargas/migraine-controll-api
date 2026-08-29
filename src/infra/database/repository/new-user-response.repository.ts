import { DeepPartial, FindOptionsWhere } from 'typeorm';
import { NewUserResponseEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class NewUserResponseRepository extends BaseRepository<NewUserResponseEntity> {
  async bulkCreate(data: DeepPartial<NewUserResponseEntity>[]): Promise<NewUserResponseEntity[]> {
    return this.repository.save(this.repository.create(data));
  }

  async delete(
    criteria: FindOptionsWhere<NewUserResponseEntity> | FindOptionsWhere<NewUserResponseEntity>[],
  ): Promise<void> {
    await this.repository.delete(criteria);
  }
}
