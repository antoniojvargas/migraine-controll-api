import { SQSEvent } from 'aws-lambda';
import { logger } from '@/config/logger';

jest.mock('@/config/instrument', () => ({}));
jest.mock('@/config/logger', () => ({ logger: { error: jest.fn() } }));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

const execute = jest.fn();
jest.mock('@/usecase/weather/ingest-weather-tile.uc', () => ({
  IngestWeatherTileUc: jest.fn().mockImplementation(() => ({ execute })),
}));

jest.mock('@/infra/database/repository/weather-tile.repository', () => ({
  WeatherTileRepository: jest.fn(),
}));

jest.mock('@/infra/weather/open-meteo-weather-provider.adapter', () => ({
  OpenMeteoWeatherProviderAdapter: jest.fn(),
}));

const getRepository = jest.fn();
jest.mock('@/infra/database/dataSource', () => ({
  dataSource: {
    isInitialized: true,
    initialize: jest.fn(),
    getRepository,
  },
}));

import * as Sentry from '@sentry/node';
import { handler } from '@/adapter/lambda/weather-queue-consumer.lambda';

const buildRecord = (
  overrides: Partial<SQSEvent['Records'][number]> = {},
): SQSEvent['Records'][number] =>
  ({
    messageId: 'msg-1',
    body: JSON.stringify({ geohash6: 'u4pruy', type: 'history' }),
    ...overrides,
  }) as SQSEvent['Records'][number];

describe('weather-queue-consumer handler', () => {
  afterEach(() => {
    execute.mockReset();
    (logger.error as jest.Mock).mockReset();
    (Sentry.captureException as jest.Mock).mockReset();
    (Sentry.flush as jest.Mock).mockClear();
  });

  it('ingests weather for every record and reports no failures', async () => {
    execute.mockResolvedValue(undefined);
    const event = {
      Records: [buildRecord({ messageId: 'msg-1' }), buildRecord({ messageId: 'msg-2' })],
    };

    const result = await handler(event as SQSEvent);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenCalledWith({ geohash6: 'u4pruy', type: 'history' });
    expect(result).toEqual({ batchItemFailures: [] });
  });

  it('reports the failing message as a batch item failure without failing the whole batch', async () => {
    execute.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('provider down'));
    const event = {
      Records: [buildRecord({ messageId: 'msg-1' }), buildRecord({ messageId: 'msg-2' })],
    };

    const result = await handler(event as SQSEvent);

    expect(result).toEqual({ batchItemFailures: [{ itemIdentifier: 'msg-2' }] });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'msg-2' }),
      'Failed to ingest weather tile from WEATHER_QUEUE',
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
  });

  it('reports malformed message bodies as batch item failures', async () => {
    const event = { Records: [buildRecord({ messageId: 'msg-bad', body: 'not-json' })] };

    const result = await handler(event as SQSEvent);

    expect(result).toEqual({ batchItemFailures: [{ itemIdentifier: 'msg-bad' }] });
    expect(execute).not.toHaveBeenCalled();
  });

  it('does not flush Sentry when there are no failures', async () => {
    execute.mockResolvedValue(undefined);
    const event = { Records: [buildRecord()] };

    await handler(event as SQSEvent);

    expect(Sentry.flush).not.toHaveBeenCalled();
  });

  it('returns an empty batchItemFailures array for an empty batch', async () => {
    const result = await handler({ Records: [] } as unknown as SQSEvent);

    expect(result).toEqual({ batchItemFailures: [] });
    expect(execute).not.toHaveBeenCalled();
  });
});
