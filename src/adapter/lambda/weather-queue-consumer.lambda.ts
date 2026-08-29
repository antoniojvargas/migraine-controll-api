import '@/config/instrument';
import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import * as Sentry from '@sentry/node';
import { dataSource } from '@/infra/database/dataSource';
import { buildRepositories } from '@/factory/container';
import { OpenMeteoWeatherProviderAdapter } from '@/infra/weather/open-meteo-weather-provider.adapter';
import {
  IngestWeatherTileUc,
  WeatherIngestionType,
} from '@/usecase/weather/ingest-weather-tile.uc';
import { logger } from '@/config/logger';

interface WeatherQueueMessage {
  geohash6: string;
  type: WeatherIngestionType;
}

const parseMessage = (record: SQSRecord): WeatherQueueMessage =>
  JSON.parse(record.body) as WeatherQueueMessage;

const ensureDataSourceInitialized = async (): Promise<void> => {
  if (dataSource.isInitialized === false) {
    await dataSource.initialize();
  }
};

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  await ensureDataSourceInitialized();

  const repos = buildRepositories(dataSource);
  const ingestWeatherTileUc = new IngestWeatherTileUc(
    repos.weatherTile,
    new OpenMeteoWeatherProviderAdapter(),
  );

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const message = parseMessage(record);
      await ingestWeatherTileUc.execute(message);
    } catch (err) {
      logger.error(
        { err, messageId: record.messageId },
        'Failed to ingest weather tile from WEATHER_QUEUE',
      );
      Sentry.captureException(err, {
        tags: { domain: 'weather' },
        extra: { messageId: record.messageId },
      });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  if (batchItemFailures.length > 0) {
    await Sentry.flush(2000);
  }

  return { batchItemFailures };
};
