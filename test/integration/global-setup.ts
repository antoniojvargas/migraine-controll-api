import { execSync } from 'child_process';
import { Pool } from 'pg';

const DB_HOST = 'localhost';
const DB_PORT = 5434;
const DB_USER = 'test';
const DB_PASSWORD = 'test';
const DB_NAME = 'test';

async function waitForPostgres(): Promise<void> {
  const pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      await pool.query('SELECT 1');
      await pool.end();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Test Postgres did not become ready in time');
}

export default async function globalSetup(): Promise<void> {
  execSync('docker compose -f docker-compose.test.yml up -d', { stdio: 'inherit' });
  await waitForPostgres();
}
