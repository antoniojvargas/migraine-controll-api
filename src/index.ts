import { buildApp } from '@/factory/build-app';
import { logger } from '@/config/logger';

const app = buildApp();

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

void start();
