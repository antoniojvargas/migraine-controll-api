import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { UserResponseEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class UserResponseRepository implements RepositoryInterface<UserResponseEntity> {
  constructor(private readonly repository: Repository<UserResponseEntity>) {}

  async create(data: DeepPartial<UserResponseEntity>): Promise<UserResponseEntity> {
    return this.repository.save(this.repository.create(data));
  }

  async bulkCreate(data: DeepPartial<UserResponseEntity>[]): Promise<UserResponseEntity[]> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<UserResponseEntity> | FindOptionsWhere<UserResponseEntity>[],
  ): Promise<UserResponseEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<UserResponseEntity> | FindOptionsWhere<UserResponseEntity>[],
  ): Promise<UserResponseEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<UserResponseEntity>,
    data: DeepPartial<UserResponseEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<UserResponseEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
