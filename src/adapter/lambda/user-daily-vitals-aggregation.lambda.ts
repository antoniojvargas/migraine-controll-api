import '@/config/instrument';
import * as Sentry from '@sentry/node';
import { envs } from '@/config/env';
import { dataSource } from '@/infra/database/dataSource';
import { buildRepositories } from '@/factory/container';
import { DocumentDbClient } from '@/infra/documentdb/documentdb-client';
import { s3Client } from '@/infra/aws/s3Client';
import { AggregateUserDailyVitalsUc } from '@/usecase/vitals/aggregate-user-daily-vitals.uc';
import { logger } from '@/config/logger';

const ensureDataSourceInitialized = async (): Promise<void> => {
  if (dataSource.isInitialized === false) {
    await dataSource.initialize();
  }
};

export const handler = async (): Promise<void> => {
  const documentDbClient = new DocumentDbClient(s3Client, {
    connectionUri: envs.DOCUMENTDB_URI,
    caBundleBucket: envs.CA_BUNDLES_BUCKET,
    caBundleKey: envs.CA_BUNDLE_KEY,
  });

  try {
    await ensureDataSourceInitialized();

    const repos = buildRepositories(dataSource);

    const result = await new AggregateUserDailyVitalsUc(
      documentDbClient,
      envs.DOCUMENTDB_DATABASE,
      envs.DOCUMENTDB_COLLECTION,
      repos.terraUser,
      repos.userDailyVitals,
    ).execute();

    logger.info(result, 'User daily vitals aggregation processed');
  } catch (err) {
    logger.error({ err }, 'Failed to aggregate user daily vitals');
    Sentry.captureException(err, { tags: { domain: 'user-daily-vitals-aggregation' } });
    await Sentry.flush(2000);
    throw err;
  } finally {
    await documentDbClient.close();
  }
};
