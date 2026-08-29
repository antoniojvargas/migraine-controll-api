import '@/config/instrument';
import * as Sentry from '@sentry/node';
import { dataSource } from '@/infra/database/dataSource';
import { buildRepositories } from '@/factory/container';
import { SendPreventiveTreatmentRemindersUc } from '@/usecase/notification/send-preventive-treatment-reminders.uc';
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

    const result = await new SendPreventiveTreatmentRemindersUc(
      repos.preventiveTreatmentSchedule,
      repos.preventiveTreatmentScheduleMetadata,
      repos.pushNotificationToken,
    ).execute();

    logger.info(result, 'Preventive treatment reminders processed');
  } catch (err) {
    logger.error({ err }, 'Failed to process preventive treatment reminders');
    Sentry.captureException(err, { tags: { domain: 'preventive-treatment-reminder' } });
    await Sentry.flush(2000);
    throw err;
  }
};
