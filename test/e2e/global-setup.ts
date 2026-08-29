import { execSync } from 'child_process';
import { createRequire } from 'module';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { SQSClient, CreateQueueCommand } from '@aws-sdk/client-sqs';
import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  MONGO_URI,
  SQS_ENDPOINT,
  QUEUE_NAME,
  API_URL,
} from './constants';

const COMPOSE_FILE = 'docker-compose.e2e.yml';

async function waitForPostgres(): Promise<void> {
  const pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      await pool.query('SELECT 1');
      await pool.end();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('E2E Postgres did not become ready in time');
}

async function waitForMongo(): Promise<void> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 1000 });
    try {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      await client.close();
      return;
    } catch {
      await client.close().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('E2E Mongo did not become ready in time');
}

async function waitForQueue(): Promise<void> {
  const sqsClient = new SQSClient({
    region: 'us-east-1',
    endpoint: SQS_ENDPOINT,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      await sqsClient.send(new CreateQueueCommand({ QueueName: QUEUE_NAME }));
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Localstack SQS did not become ready in time');
}

async function waitForApi(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // API container is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('API container did not become ready in time');
}

// Corre las migraciones desde el host (igual que test/integration/helpers.ts), en vez de
// dentro del contenedor: requerir los archivos .ts de migraciones vía ts-node dentro del
// contenedor Alpine resultó intermitentemente inestable (el loader de módulos de Node
// intenta un import() ESM sobre un archivo .ts y el proceso termina con código 1).
async function runMigrations(): Promise<void> {
  process.env.DB_HOST = DB_HOST;
  process.env.DB_PORT = String(DB_PORT);
  process.env.DB_USER = DB_USER;
  process.env.DB_PASSWORD = DB_PASSWORD;
  process.env.DB_NAME = DB_NAME;
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-secret';
  process.env.COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? 'us-east-1_e2etest01';
  const nodeRequire = createRequire(__filename);
  nodeRequire('tsconfig-paths/register');
  const { dataSource } = nodeRequire('../../src/infra/database/dataSource');
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await dataSource.runMigrations();
  await dataSource.destroy();
}

export default async function globalSetup(): Promise<void> {
  execSync(`docker compose -f ${COMPOSE_FILE} up -d --build`, { stdio: 'inherit' });
  await waitForPostgres();
  await waitForMongo();
  await waitForQueue();
  await runMigrations();
  await waitForApi();
}
