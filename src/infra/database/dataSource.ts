import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { envs } from '@/config/env';

export const dataSource = new DataSource({
  type: 'postgres',
  host: envs.DB_HOST,
  port: envs.DB_PORT,
  username: envs.DB_USER,
  password: envs.DB_PASSWORD,
  database: envs.DB_NAME,
  uuidExtension: 'pgcrypto',
  entities: ['src/infra/database/entities/**/*.ts'],
  migrations: ['src/infra/database/migrations/**/*.ts'],
  synchronize: false,
});
