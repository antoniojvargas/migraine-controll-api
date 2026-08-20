import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { SelectionEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class SelectionRepository implements RepositoryInterface<SelectionEntity> {
  constructor(private readonly repository: Repository<SelectionEntity>) {}

  async create(data: DeepPartial<SelectionEntity>): Promise<SelectionEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<SelectionEntity> | FindOptionsWhere<SelectionEntity>[],
  ): Promise<SelectionEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<SelectionEntity> | FindOptionsWhere<SelectionEntity>[],
  ): Promise<SelectionEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<SelectionEntity>,
    data: DeepPartial<SelectionEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<SelectionEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
