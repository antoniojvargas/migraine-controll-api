import awsLambdaFastify from '@fastify/aws-lambda';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { buildApp } from '@/factory/build-app';
import { dataSource } from '@/infra/database/dataSource';

const app = buildApp({ dataSource });
const proxy = awsLambdaFastify(app);

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> => {
  if (dataSource.isInitialized === false) {
    await dataSource.initialize();
  }
  return proxy(event, context);
};
