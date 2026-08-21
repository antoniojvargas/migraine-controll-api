import { DeepPartial, DataSource, EntityTarget, ObjectLiteral } from 'typeorm';

export interface SeederContext {
  factoryManager?: unknown;
}

export interface Seeder {
  run(dataSource: DataSource, context?: SeederContext): Promise<unknown>;
}

export abstract class BaseSeeder implements Seeder {
  abstract run(dataSource: DataSource, context?: SeederContext): Promise<unknown>;
}

export async function seedData<T extends ObjectLiteral>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
  data: DeepPartial<T>[],
  entityName: string,
): Promise<T[]> {
  if (!dataSource.isInitialized) {
    throw new Error(`[seed:${entityName}] dataSource is not initialized`);
  }
  if (data.length === 0) {
    return [];
  }
  const repository = dataSource.getRepository(entity);
  try {
    return await repository.save(repository.create(data));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`[seed:${entityName}] failed to seed ${data.length} rows: ${reason}`);
  }
}
