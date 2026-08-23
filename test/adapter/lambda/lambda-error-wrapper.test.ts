import { Context } from 'aws-lambda';
import * as Sentry from '@sentry/node';
import { logger } from '@/config/logger';
import { withErrorWrapper } from '@/adapter/lambda/lambda-error-wrapper';

jest.mock('@/config/logger', () => ({
  logger: { error: jest.fn() },
}));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

const buildEvent = (): never =>
  ({
    rawPath: '/users/me',
    requestContext: { http: { method: 'DELETE' } },
  }) as never;

const buildContext = (): Context => ({ awsRequestId: 'req-1' }) as Context;

describe('withErrorWrapper', () => {
  afterEach(() => {
    (logger.error as jest.Mock).mockReset();
    (Sentry.captureException as jest.Mock).mockReset();
    (Sentry.flush as jest.Mock).mockClear();
  });

  it('returns the handler result when it does not throw', async () => {
    const handler = jest.fn().mockResolvedValue({ statusCode: 200, body: 'ok' });
    const wrapped = withErrorWrapper('users', handler);

    const result = await wrapped(buildEvent(), buildContext());

    expect(result).toEqual({ statusCode: 200, body: 'ok' });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs the error and returns a generic 500 response when the handler throws', async () => {
    const error = new Error('boom');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = withErrorWrapper('users', handler);

    const result = await wrapped(buildEvent(), buildContext());

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: error,
        domain: 'users',
        requestId: 'req-1',
        path: '/users/me',
        method: 'DELETE',
      }),
      'Unhandled Lambda error',
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: { domain: 'users' },
        extra: expect.objectContaining({ requestId: 'req-1', path: '/users/me', method: 'DELETE' }),
      }),
    );
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
    expect(result).toMatchObject({ statusCode: 500 });
    expect(JSON.parse((result as { body: string }).body)).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });
});
