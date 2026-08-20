import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { SessionEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class SessionRepository implements RepositoryInterface<SessionEntity> {
  constructor(private readonly repository: Repository<SessionEntity>) {}

  async create(data: DeepPartial<SessionEntity>): Promise<SessionEntity> {
    return this.repository.save(this.repository.create(data));
  }

  async bulkCreate(data: DeepPartial<SessionEntity>[]): Promise<SessionEntity[]> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<SessionEntity> | FindOptionsWhere<SessionEntity>[],
  ): Promise<SessionEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<SessionEntity> | FindOptionsWhere<SessionEntity>[],
  ): Promise<SessionEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<SessionEntity>,
    data: DeepPartial<SessionEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<SessionEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
