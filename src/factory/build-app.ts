import Fastify from 'fastify';
import { logger } from '@/config/logger';

export const buildApp = (): ReturnType<typeof Fastify> => {
  const app = Fastify({ loggerInstance: logger });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
};
