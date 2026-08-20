import { DeepPartial, FindOptionsWhere, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface RepositoryInterface<T extends ObjectLiteral> {
  create(data: DeepPartial<T>): Promise<T>;

  findOneBy(criteria: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T | null>;

  findAllBy(criteria: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T[]>;

  update(criteria: FindOptionsWhere<T>, data: DeepPartial<T>): Promise<void>;

  createQueryBuilder(alias: string): SelectQueryBuilder<T>;
}
