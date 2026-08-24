import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { PushNotificationTokenEntity } from '@/infra/database/entities';
import { sqsClient } from '@/infra/aws/sqsClient';
import {
  dedupeTokens,
  enqueueNotificationForToken,
  notifyUsers,
} from '@/usecase/notification/notificationHelpers';

jest.mock('@/infra/aws/sqsClient', () => ({
  sqsClient: { send: jest.fn() },
}));
jest.mock('@/config/env', () => ({
  envs: { NOTIFICATION_QUEUE_URL: 'https://sqs.example.com/notification-queue' },
}));

const send = sqsClient.send as jest.Mock;

const buildToken = (
  overrides: Partial<PushNotificationTokenEntity> = {},
): PushNotificationTokenEntity =>
  ({
    id: 'token-id',
    token: 'device-token-1',
    channel: 'fcm',
    appVersion: '1.2.3',
    phoneManufacturer: 'Apple',
    phoneOsName: 'iOS',
    phoneOsVersion: '17.0',
    ...overrides,
  }) as PushNotificationTokenEntity;

describe('dedupeTokens', () => {
  it('returns the same tokens when there are no duplicates', () => {
    const tokens = [buildToken({ token: 'a' }), buildToken({ token: 'b' })];
    expect(dedupeTokens(tokens)).toEqual(tokens);
  });

  it('removes duplicate tokens keeping the first occurrence', () => {
    const first = buildToken({ token: 'a', phoneOsVersion: 'first' });
    const duplicate = buildToken({ token: 'a', phoneOsVersion: 'second' });
    const other = buildToken({ token: 'b' });

    const result = dedupeTokens([first, duplicate, other]);

    expect(result).toEqual([first, other]);
  });

  it('returns an empty array when given an empty array', () => {
    expect(dedupeTokens([])).toEqual([]);
  });

  it('treats tokens with different string values as distinct', () => {
    const tokens = [buildToken({ token: 'a' }), buildToken({ token: 'A' })];
    expect(dedupeTokens(tokens)).toHaveLength(2);
  });
});

describe('enqueueNotificationForToken', () => {
  afterEach(() => {
    send.mockReset();
  });

  it('sends a message with the token, channel, payload and phone metadata', async () => {
    send.mockResolvedValueOnce({});
    const token = buildToken();
    const payload = { title: 'Weekly summary', body: 'You logged 3 migraines this week' };

    await enqueueNotificationForToken(token, payload);

    expect(send.mock.calls[0][0]).toBeInstanceOf(SendMessageCommand);
    const input = send.mock.calls[0][0].input;
    expect(input.QueueUrl).toBe('https://sqs.example.com/notification-queue');
    expect(JSON.parse(input.MessageBody)).toEqual({
      token: 'device-token-1',
      channel: 'fcm',
      payload,
      metadata: {
        appVersion: '1.2.3',
        phoneManufacturer: 'Apple',
        phoneOsName: 'iOS',
        phoneOsVersion: '17.0',
      },
    });
  });

  it('includes null phone metadata fields as-is', async () => {
    send.mockResolvedValueOnce({});
    const token = buildToken({
      appVersion: null,
      phoneManufacturer: null,
      phoneOsName: null,
      phoneOsVersion: null,
    });

    await enqueueNotificationForToken(token, { title: 't', body: 'b' });

    const input = send.mock.calls[0][0].input;
    expect(JSON.parse(input.MessageBody).metadata).toEqual({
      appVersion: null,
      phoneManufacturer: null,
      phoneOsName: null,
      phoneOsVersion: null,
    });
  });

  it('propagates errors from the SQS client', async () => {
    send.mockRejectedValueOnce(new Error('sqs unavailable'));

    await expect(
      enqueueNotificationForToken(buildToken(), { title: 't', body: 'b' }),
    ).rejects.toThrow('sqs unavailable');
  });
});

describe('notifyUsers', () => {
  afterEach(() => {
    send.mockReset();
  });

  it('fans out to every token across all given users', async () => {
    send.mockResolvedValue({});
    const users = [
      { userId: 'user-1', tokens: [buildToken({ token: 'a' }), buildToken({ token: 'b' })] },
      { userId: 'user-2', tokens: [buildToken({ token: 'c' })] },
    ];

    await notifyUsers(users, { title: 't', body: 'b' });

    expect(send).toHaveBeenCalledTimes(3);
  });

  it('dedupes tokens shared across users before sending', async () => {
    send.mockResolvedValue({});
    const shared = buildToken({ token: 'shared-token' });
    const users = [
      { userId: 'user-1', tokens: [shared] },
      { userId: 'user-2', tokens: [shared] },
    ];

    await notifyUsers(users, { title: 't', body: 'b' });

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no users are given', async () => {
    await notifyUsers([], { title: 't', body: 'b' });

    expect(send).not.toHaveBeenCalled();
  });

  it('does nothing when users have no tokens', async () => {
    await notifyUsers([{ userId: 'user-1', tokens: [] }], { title: 't', body: 'b' });

    expect(send).not.toHaveBeenCalled();
  });

  it('rejects if any enqueue call fails', async () => {
    send.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('sqs unavailable'));
    const users = [
      { userId: 'user-1', tokens: [buildToken({ token: 'a' }), buildToken({ token: 'b' })] },
    ];

    await expect(notifyUsers(users, { title: 't', body: 'b' })).rejects.toThrow('sqs unavailable');
  });
});
