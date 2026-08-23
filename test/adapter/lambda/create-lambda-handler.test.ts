import { Context } from 'aws-lambda';
import { FastifyInstance } from 'fastify';

const proxyMock = jest.fn();
const awsLambdaFastifyMock = jest.fn().mockReturnValue(proxyMock);
const dataSourceMock = { isInitialized: false, initialize: jest.fn() };

jest.mock('@fastify/aws-lambda', () => ({
  __esModule: true,
  default: (app: FastifyInstance) => awsLambdaFastifyMock(app),
}));
jest.mock('@/infra/database/dataSource', () => ({ dataSource: dataSourceMock }));
jest.mock('@/config/logger', () => ({ logger: { error: jest.fn() } }));

import { createLambdaHandler } from '@/adapter/lambda/create-lambda-handler';

const buildEvent = (): never => ({ rawPath: '/profiles' }) as never;
const buildContext = (): Context => ({ awsRequestId: 'req-1' }) as Context;

describe('createLambdaHandler', () => {
  beforeEach(() => {
    proxyMock.mockReset();
    awsLambdaFastifyMock.mockClear();
    dataSourceMock.isInitialized = false;
    dataSourceMock.initialize.mockReset().mockResolvedValue(undefined);
  });

  it('initializes the data source on a cold start and delegates to the aws-lambda-fastify proxy', async () => {
    proxyMock.mockResolvedValue({ statusCode: 200, body: 'ok' });
    const app = { fake: true } as unknown as FastifyInstance;
    const handler = createLambdaHandler('profiles', app);

    const result = await handler(buildEvent(), buildContext());

    expect(awsLambdaFastifyMock).toHaveBeenCalledWith(app);
    expect(dataSourceMock.initialize).toHaveBeenCalledTimes(1);
    expect(proxyMock).toHaveBeenCalledWith(
      buildEvent(),
      expect.objectContaining({ awsRequestId: 'req-1' }),
    );
    expect(result).toEqual({ statusCode: 200, body: 'ok' });
  });

  it('skips re-initializing an already-initialized data source (warm start)', async () => {
    dataSourceMock.isInitialized = true;
    proxyMock.mockResolvedValue({ statusCode: 200, body: 'ok' });
    const handler = createLambdaHandler('profiles', {} as FastifyInstance);

    await handler(buildEvent(), buildContext());

    expect(dataSourceMock.initialize).not.toHaveBeenCalled();
  });

  it('is wrapped by the central error handler and returns a generic 500 on failure', async () => {
    proxyMock.mockRejectedValue(new Error('db down'));
    const handler = createLambdaHandler('profiles', {} as FastifyInstance);

    const result = await handler(buildEvent(), buildContext());

    expect(result).toMatchObject({ statusCode: 500 });
  });
});
