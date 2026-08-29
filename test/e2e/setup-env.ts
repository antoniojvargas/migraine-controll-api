import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  SQS_ENDPOINT,
  QUEUE_URL,
} from './constants';

// Runs before any src module is imported, so that `@/config/env` (evaluated at import time)
// picks up the ports/credentials that docker-compose.e2e.yml exposes on the host side.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DB_HOST = process.env.DB_HOST ?? DB_HOST;
process.env.DB_PORT = process.env.DB_PORT ?? String(DB_PORT);
process.env.DB_USER = process.env.DB_USER ?? DB_USER;
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? DB_PASSWORD;
process.env.DB_NAME = process.env.DB_NAME ?? DB_NAME;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-secret';
process.env.AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ?? 'test';
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ?? 'test';
process.env.AWS_ENDPOINT_URL_SQS = process.env.AWS_ENDPOINT_URL_SQS ?? SQS_ENDPOINT;
process.env.NOTIFICATION_QUEUE_URL = process.env.NOTIFICATION_QUEUE_URL ?? QUEUE_URL;
process.env.COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? 'us-east-1_e2etest01';
