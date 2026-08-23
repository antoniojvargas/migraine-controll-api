import * as Sentry from '@sentry/node';
import { envs } from '@/config/env';

Sentry.init({
  dsn: envs.SENTRY_DSN !== '' ? envs.SENTRY_DSN : undefined,
  environment: envs.NODE_ENV,
  enabled: envs.SENTRY_DSN !== '',
  tracesSampleRate: 0,
});
