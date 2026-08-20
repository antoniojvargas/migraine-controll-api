import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { ProfileEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class ProfileRepository implements RepositoryInterface<ProfileEntity> {
  constructor(private readonly repository: Repository<ProfileEntity>) {}

  async create(data: DeepPartial<ProfileEntity>): Promise<ProfileEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<ProfileEntity> | FindOptionsWhere<ProfileEntity>[],
  ): Promise<ProfileEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<ProfileEntity> | FindOptionsWhere<ProfileEntity>[],
  ): Promise<ProfileEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<ProfileEntity>,
    data: DeepPartial<ProfileEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<ProfileEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
