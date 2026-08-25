import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { TerraUserEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class TerraUserRepository implements RepositoryInterface<TerraUserEntity> {
  constructor(private readonly repository: Repository<TerraUserEntity>) {}

  async create(data: DeepPartial<TerraUserEntity>): Promise<TerraUserEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<TerraUserEntity> | FindOptionsWhere<TerraUserEntity>[],
  ): Promise<TerraUserEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<TerraUserEntity> | FindOptionsWhere<TerraUserEntity>[],
  ): Promise<TerraUserEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<TerraUserEntity>,
    data: DeepPartial<TerraUserEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<TerraUserEntity> {
    return this.repository.createQueryBuilder(alias);
  }

  findByTerraUserId(terraUserId: string): Promise<TerraUserEntity | null> {
    return this.repository.findOneBy({ terraUserId });
  }
}
