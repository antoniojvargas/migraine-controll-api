import { buildApp } from '@/factory/build-app';
import { dataSource } from '@/infra/database/dataSource';
import { logger } from '@/config/logger';

const app = buildApp({ dataSource });

const start = async (): Promise<void> => {
  try {
    if (dataSource.isInitialized === false) {
      await dataSource.initialize();
    }
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

void start();
