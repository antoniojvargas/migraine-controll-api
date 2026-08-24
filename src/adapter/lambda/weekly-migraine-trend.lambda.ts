import '@/config/instrument';
import * as Sentry from '@sentry/node';
import { dataSource } from '@/infra/database/dataSource';
import { MigraineLogEntity, PushNotificationTokenEntity } from '@/infra/database/entities';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
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

    const migraineLogRepository = new MigraineLogRepository(
      dataSource.getRepository(MigraineLogEntity),
    );
    const pushNotificationTokenRepository = new PushNotificationTokenRepository(
      dataSource.getRepository(PushNotificationTokenEntity),
    );

    const result = await new SendWeeklyMigraineTrendAlertsUc(
      migraineLogRepository,
      pushNotificationTokenRepository,
    ).execute();

    logger.info(result, 'Weekly migraine trend alerts processed');
  } catch (err) {
    logger.error({ err }, 'Failed to process weekly migraine trend alerts');
    Sentry.captureException(err, { tags: { domain: 'weekly-migraine-trend' } });
    await Sentry.flush(2000);
    throw err;
  }
};
