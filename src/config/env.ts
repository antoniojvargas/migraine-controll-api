import 'dotenv/config';
import { cleanEnv, str, port } from 'envalid';

export const envs = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),

  DB_HOST: str(),
  DB_PORT: port({ default: 5432 }),
  DB_USER: str(),
  DB_PASSWORD: str(),
  DB_NAME: str(),

  AWS_REGION: str({ default: 'us-east-1' }),
  AWS_ACCESS_KEY_ID: str({ default: '' }),
  AWS_SECRET_ACCESS_KEY: str({ default: '' }),

  JWT_SECRET: str(),

  COGNITO_USER_POOL_ID: str({ default: '' }),
  COGNITO_LEGACY_USER_POOL_ID: str({ default: '' }),

  NOTIFICATION_QUEUE_URL: str({ default: '' }),
  WEATHER_QUEUE_URL: str({ default: '' }),

  TERRA_RAW_PAYLOADS_BUCKET: str({ default: '' }),
  CA_BUNDLES_BUCKET: str({ default: '' }),
});
