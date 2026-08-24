import '@/config/instrument';
import { PublishCommand } from '@aws-sdk/client-sns';
import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import * as Sentry from '@sentry/node';
import { snsClient } from '@/infra/aws/snsClient';
import { logger } from '@/config/logger';
import { NotificationPayload } from '@/usecase/notification/notificationHelpers';

interface NotificationQueueMessage {
  token: string;
  channel: string;
  payload: NotificationPayload;
  metadata: Record<string, string | null>;
}

const parseMessage = (record: SQSRecord): NotificationQueueMessage =>
  JSON.parse(record.body) as NotificationQueueMessage;

const dispatchNotification = async (message: NotificationQueueMessage): Promise<void> => {
  await snsClient.send(
    new PublishCommand({
      TargetArn: message.token,
      Message: JSON.stringify(message.payload),
    }),
  );
};

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const message = parseMessage(record);
      await dispatchNotification(message);
    } catch (err) {
      logger.error(
        { err, messageId: record.messageId },
        'Failed to dispatch push notification from NOTIFICATION_QUEUE',
      );
      Sentry.captureException(err, {
        tags: { domain: 'notifications' },
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
