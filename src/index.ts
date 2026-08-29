import { buildApp } from '@/factory/build-app';
import { dataSource } from '@/infra/database/dataSource';
import { envs } from '@/config/env';
import { logger } from '@/config/logger';
import { InsecureBearerSubVerifier } from '@/adapter/http/plugins/insecure-bearer-verifier';

// `dist/index.js` es el entrypoint del servidor local y del contenedor e2e, no
// de producción (los Lambda usan `dist/adapter/lambda/*.lambda.handler`). Fuera
// de producción no hay un user pool de Cognito real contra el que verificar
// firmas, así que se usa un verificador que trata el Bearer como el `sub`.
const cognitoJwtVerifier =
  envs.NODE_ENV === 'production' ? undefined : new InsecureBearerSubVerifier();

const app = buildApp({ dataSource, cognitoJwtVerifier });

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
