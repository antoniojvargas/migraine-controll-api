import {
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  QueryDeepPartialEntity,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { RepositoryInterface } from './repository.interface';

/**
 * Implementación común de {@link RepositoryInterface} sobre un `Repository<T>` de
 * TypeORM. Cada repositorio concreto extiende esta clase y solo agrega los
 * métodos específicos de su entidad (ej. `bulkCreate`, `softDelete`,
 * `findByTerraUserId`).
 */
export abstract class BaseRepository<T extends ObjectLiteral> implements RepositoryInterface<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(criteria: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(criteria: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T[]> {
    return this.repository.findBy(criteria);
  }

  async update(criteria: FindOptionsWhere<T>, data: DeepPartial<T>): Promise<void> {
    await this.repository.update(criteria, data as QueryDeepPartialEntity<T>);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }
}
