import '@/config/instrument';
import * as Sentry from '@sentry/node';
import { dataSource } from '@/infra/database/dataSource';
import { buildRepositories } from '@/factory/container';
import { SendWeeklyMigraineTrendAlertsUc } from '@/usecase/notification/send-weekly-migraine-trend-alerts.uc';
import { logger } from '@/config/logger';

const ensureDataSourceInitialized = async (): Promise<void> => {
  if (dataSource.isInitialized === false) {
    await dataSource.initialize();
  }
};

export const handler = async (): Promise<void> => {
  try {
    await ensureDataSourceInitialized();

    const repos = buildRepositories(dataSource);

    const result = await new SendWeeklyMigraineTrendAlertsUc(
      repos.migraineLog,
      repos.pushNotificationToken,
    ).execute();

    logger.info(result, 'Weekly migraine trend alerts processed');
  } catch (err) {
    logger.error({ err }, 'Failed to process weekly migraine trend alerts');
    Sentry.captureException(err, { tags: { domain: 'weekly-migraine-trend' } });
    await Sentry.flush(2000);
    throw err;
  }
};
