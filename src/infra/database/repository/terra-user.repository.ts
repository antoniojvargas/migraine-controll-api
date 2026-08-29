import { TerraUserEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class TerraUserRepository extends BaseRepository<TerraUserEntity> {
  findByTerraUserId(terraUserId: string): Promise<TerraUserEntity | null> {
    return this.repository.findOneBy({ terraUserId });
  }
}
