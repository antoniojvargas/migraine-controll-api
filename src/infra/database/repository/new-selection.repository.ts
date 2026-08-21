import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { NewSelectionEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class NewSelectionRepository implements RepositoryInterface<NewSelectionEntity> {
  constructor(private readonly repository: Repository<NewSelectionEntity>) {}

  async create(data: DeepPartial<NewSelectionEntity>): Promise<NewSelectionEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<NewSelectionEntity> | FindOptionsWhere<NewSelectionEntity>[],
  ): Promise<NewSelectionEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<NewSelectionEntity> | FindOptionsWhere<NewSelectionEntity>[],
  ): Promise<NewSelectionEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<NewSelectionEntity>,
    data: DeepPartial<NewSelectionEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<NewSelectionEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
