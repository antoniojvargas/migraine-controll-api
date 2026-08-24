import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { PushNotificationTokenEntity } from '@/infra/database/entities';
import { sqsClient } from '@/infra/aws/sqsClient';
import { envs } from '@/config/env';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface UserNotificationTokens {
  userId: string;
  tokens: PushNotificationTokenEntity[];
}

export const dedupeTokens = (
  tokens: PushNotificationTokenEntity[],
): PushNotificationTokenEntity[] => {
  const seen = new Set<string>();
  const deduped: PushNotificationTokenEntity[] = [];
  for (const token of tokens) {
    if (seen.has(token.token)) {
      continue;
    }
    seen.add(token.token);
    deduped.push(token);
  }
  return deduped;
};

export const enqueueNotificationForToken = async (
  token: PushNotificationTokenEntity,
  payload: NotificationPayload,
): Promise<void> => {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: envs.NOTIFICATION_QUEUE_URL,
      MessageBody: JSON.stringify({
        token: token.token,
        channel: token.channel,
        payload,
        metadata: {
          appVersion: token.appVersion,
          phoneManufacturer: token.phoneManufacturer,
          phoneOsName: token.phoneOsName,
          phoneOsVersion: token.phoneOsVersion,
        },
      }),
    }),
  );
};

export const notifyUsers = async (
  users: UserNotificationTokens[],
  payload: NotificationPayload,
): Promise<void> => {
  const allTokens = users.flatMap((user) => user.tokens);
  const deduped = dedupeTokens(allTokens);
  await Promise.all(deduped.map((token) => enqueueNotificationForToken(token, payload)));
};
