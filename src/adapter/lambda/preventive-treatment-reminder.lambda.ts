import '@/config/instrument';
import * as Sentry from '@sentry/node';
import { dataSource } from '@/infra/database/dataSource';
import {
  PreventiveTreatmentScheduleEntity,
  PreventiveTreatmentScheduleMetadataEntity,
  PushNotificationTokenEntity,
} from '@/infra/database/entities';
import { PreventiveTreatmentScheduleMetadataRepository } from '@/infra/database/repository/preventive-treatment-schedule-metadata.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
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

    const preventiveTreatmentScheduleRepository = new PreventiveTreatmentScheduleRepository(
      dataSource.getRepository(PreventiveTreatmentScheduleEntity),
    );
    const preventiveTreatmentScheduleMetadataRepository =
      new PreventiveTreatmentScheduleMetadataRepository(
        dataSource.getRepository(PreventiveTreatmentScheduleMetadataEntity),
      );
    const pushNotificationTokenRepository = new PushNotificationTokenRepository(
      dataSource.getRepository(PushNotificationTokenEntity),
    );

    const result = await new SendPreventiveTreatmentRemindersUc(
      preventiveTreatmentScheduleRepository,
      preventiveTreatmentScheduleMetadataRepository,
      pushNotificationTokenRepository,
    ).execute();

    logger.info(result, 'Preventive treatment reminders processed');
  } catch (err) {
    logger.error({ err }, 'Failed to process preventive treatment reminders');
    Sentry.captureException(err, { tags: { domain: 'preventive-treatment-reminder' } });
    await Sentry.flush(2000);
    throw err;
  }
};
