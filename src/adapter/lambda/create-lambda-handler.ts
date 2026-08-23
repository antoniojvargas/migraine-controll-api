import '@/config/instrument';
import awsLambdaFastify from '@fastify/aws-lambda';
import { FastifyInstance } from 'fastify';
import { dataSource } from '@/infra/database/dataSource';
import { LambdaHttpHandler, withErrorWrapper } from './lambda-error-wrapper';

export const createLambdaHandler = (domain: string, app: FastifyInstance): LambdaHttpHandler => {
  const proxy = awsLambdaFastify(app);

  return withErrorWrapper(domain, async (event, context) => {
    if (dataSource.isInitialized === false) {
      await dataSource.initialize();
    }
    return proxy(event, context);
  });
};
