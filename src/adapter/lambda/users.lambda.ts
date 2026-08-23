import { buildApp } from '@/factory/build-app';
import { dataSource } from '@/infra/database/dataSource';
import { createLambdaHandler } from './create-lambda-handler';

export const handler = createLambdaHandler('users', buildApp({ dataSource }));
