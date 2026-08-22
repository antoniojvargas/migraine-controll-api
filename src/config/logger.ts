import pino from 'pino';
import { envs } from '@/config/env';
import { requestLogMixin } from '@/config/request-log-context';

const levelByEnv: Record<string, string> = {
  production: 'info',
  test: 'silent',
  development: 'debug',
};

export const logger = pino({
  level: levelByEnv[envs.NODE_ENV] ?? 'info',
  mixin: requestLogMixin,
  serializers: {
    err: pino.stdSerializers.err,
  },
  transport:
    envs.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
