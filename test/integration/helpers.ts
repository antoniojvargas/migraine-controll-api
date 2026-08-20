import { dataSource } from '@/infra/database/dataSource';

export async function initTestDb(): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
}
