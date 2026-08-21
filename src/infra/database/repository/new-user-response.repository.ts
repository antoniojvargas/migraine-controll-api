import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { NewUserResponseEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class NewUserResponseRepository implements RepositoryInterface<NewUserResponseEntity> {
  constructor(private readonly repository: Repository<NewUserResponseEntity>) {}

  async create(data: DeepPartial<NewUserResponseEntity>): Promise<NewUserResponseEntity> {
    return this.repository.save(this.repository.create(data));
  }

  async bulkCreate(data: DeepPartial<NewUserResponseEntity>[]): Promise<NewUserResponseEntity[]> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<NewUserResponseEntity> | FindOptionsWhere<NewUserResponseEntity>[],
  ): Promise<NewUserResponseEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<NewUserResponseEntity> | FindOptionsWhere<NewUserResponseEntity>[],
  ): Promise<NewUserResponseEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<NewUserResponseEntity>,
    data: DeepPartial<NewUserResponseEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<NewUserResponseEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
