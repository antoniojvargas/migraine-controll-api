import { dataSource } from '@/infra/database/dataSource';
import { logger } from '@/config/logger';

jest.mock('@/config/instrument', () => ({}));
jest.mock('@/config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

const executeMock = jest.fn();
jest.mock('@/usecase/vitals/aggregate-user-daily-vitals.uc', () => ({
  AggregateUserDailyVitalsUc: jest.fn().mockImplementation(() => ({ execute: executeMock })),
}));

const closeMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/infra/documentdb/documentdb-client', () => ({
  DocumentDbClient: jest.fn().mockImplementation(() => ({ close: closeMock })),
}));

jest.mock('@/infra/database/dataSource', () => ({
  dataSource: {
    isInitialized: true,
    initialize: jest.fn(),
    getRepository: jest.fn().mockReturnValue({}),
  },
}));

import * as Sentry from '@sentry/node';
import { handler } from '@/adapter/lambda/user-daily-vitals-aggregation.lambda';

describe('user-daily-vitals-aggregation handler', () => {
  afterEach(() => {
    executeMock.mockReset();
    closeMock.mockClear();
    (dataSource.initialize as jest.Mock).mockReset();
    (logger.info as jest.Mock).mockReset();
    (logger.error as jest.Mock).mockReset();
    (Sentry.captureException as jest.Mock).mockReset();
    (Sentry.flush as jest.Mock).mockClear();
    (dataSource as { isInitialized: boolean }).isInitialized = true;
  });

  it('initializes the data source when not already initialized', async () => {
    (dataSource as { isInitialized: boolean }).isInitialized = false;
    executeMock.mockResolvedValue({ daysProcessed: 2, skippedUnknownUsers: 0 });

    await handler();

    expect(dataSource.initialize).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      { daysProcessed: 2, skippedUnknownUsers: 0 },
      'User daily vitals aggregation processed',
    );
  });

  it('closes the DocumentDB client after a successful run', async () => {
    executeMock.mockResolvedValue({ daysProcessed: 0, skippedUnknownUsers: 0 });

    await handler();

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('logs, reports to Sentry, closes the client, and rethrows when the usecase fails', async () => {
    const error = new Error('mongo unavailable');
    executeMock.mockRejectedValue(error);

    await expect(handler()).rejects.toThrow('mongo unavailable');

    expect(logger.error).toHaveBeenCalledWith(
      { err: error },
      'Failed to aggregate user daily vitals',
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { domain: 'user-daily-vitals-aggregation' },
    });
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
