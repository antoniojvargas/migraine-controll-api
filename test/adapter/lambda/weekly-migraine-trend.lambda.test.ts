import { dataSource } from '@/infra/database/dataSource';
import { logger } from '@/config/logger';

jest.mock('@/config/instrument', () => ({}));
jest.mock('@/config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

const executeMock = jest.fn();
jest.mock('@/usecase/notification/send-weekly-migraine-trend-alerts.uc', () => ({
  SendWeeklyMigraineTrendAlertsUc: jest.fn().mockImplementation(() => ({
    execute: executeMock,
  })),
}));

jest.mock('@/infra/database/dataSource', () => ({
  dataSource: {
    isInitialized: true,
    initialize: jest.fn(),
    getRepository: jest.fn().mockReturnValue({}),
  },
}));

import * as Sentry from '@sentry/node';
import { handler } from '@/adapter/lambda/weekly-migraine-trend.lambda';

describe('weekly-migraine-trend handler', () => {
  afterEach(() => {
    executeMock.mockReset();
    (dataSource.initialize as jest.Mock).mockReset();
    (logger.info as jest.Mock).mockReset();
    (logger.error as jest.Mock).mockReset();
    (Sentry.captureException as jest.Mock).mockReset();
    (Sentry.flush as jest.Mock).mockClear();
    (dataSource as { isInitialized: boolean }).isInitialized = true;
  });

  it('initializes the data source when not already initialized', async () => {
    (dataSource as { isInitialized: boolean }).isInitialized = false;
    executeMock.mockResolvedValue({ alertsSent: 3 });

    await handler();

    expect(dataSource.initialize).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      { alertsSent: 3 },
      'Weekly migraine trend alerts processed',
    );
  });

  it('does not reinitialize the data source when already initialized', async () => {
    executeMock.mockResolvedValue({ alertsSent: 0 });

    await handler();

    expect(dataSource.initialize).not.toHaveBeenCalled();
  });

  it('logs, reports to Sentry and rethrows when the usecase fails', async () => {
    const error = new Error('db unavailable');
    executeMock.mockRejectedValue(error);

    await expect(handler()).rejects.toThrow('db unavailable');

    expect(logger.error).toHaveBeenCalledWith(
      { err: error },
      'Failed to process weekly migraine trend alerts',
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { domain: 'weekly-migraine-trend' },
    });
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
  });
});
