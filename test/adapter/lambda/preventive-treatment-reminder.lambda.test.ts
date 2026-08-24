import { dataSource } from '@/infra/database/dataSource';
import { logger } from '@/config/logger';

jest.mock('@/config/instrument', () => ({}));
jest.mock('@/config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

const executeMock = jest.fn();
jest.mock('@/usecase/notification/send-preventive-treatment-reminders.uc', () => ({
  SendPreventiveTreatmentRemindersUc: jest.fn().mockImplementation(() => ({
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
import { handler } from '@/adapter/lambda/preventive-treatment-reminder.lambda';

describe('preventive-treatment-reminder handler', () => {
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
    executeMock.mockResolvedValue({ remindersSent: 2 });

    await handler();

    expect(dataSource.initialize).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      { remindersSent: 2 },
      'Preventive treatment reminders processed',
    );
  });

  it('does not reinitialize the data source when already initialized', async () => {
    executeMock.mockResolvedValue({ remindersSent: 0 });

    await handler();

    expect(dataSource.initialize).not.toHaveBeenCalled();
  });

  it('logs, reports to Sentry and rethrows when the usecase fails', async () => {
    const error = new Error('db unavailable');
    executeMock.mockRejectedValue(error);

    await expect(handler()).rejects.toThrow('db unavailable');

    expect(logger.error).toHaveBeenCalledWith(
      { err: error },
      'Failed to process preventive treatment reminders',
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { domain: 'preventive-treatment-reminder' },
    });
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
  });
});
