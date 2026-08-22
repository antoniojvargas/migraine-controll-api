import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { UserEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class UserRepository implements RepositoryInterface<UserEntity> {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async create(data: DeepPartial<UserEntity>): Promise<UserEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<UserEntity> | FindOptionsWhere<UserEntity>[],
  ): Promise<UserEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<UserEntity> | FindOptionsWhere<UserEntity>[],
  ): Promise<UserEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<UserEntity>,
    data: DeepPartial<UserEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<UserEntity> {
    return this.repository.createQueryBuilder(alias);
  }

  async softDelete(criteria: FindOptionsWhere<UserEntity>): Promise<void> {
    await this.repository.softDelete(criteria);
  }
}
