import { PublishCommand } from '@aws-sdk/client-sns';
import { SQSEvent } from 'aws-lambda';
import { snsClient } from '@/infra/aws/snsClient';
import { logger } from '@/config/logger';

jest.mock('@/config/instrument', () => ({}));
jest.mock('@/infra/aws/snsClient', () => ({ snsClient: { send: jest.fn() } }));
jest.mock('@/config/logger', () => ({ logger: { error: jest.fn() } }));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

import * as Sentry from '@sentry/node';
import { handler } from '@/adapter/lambda/notification-queue-consumer.lambda';

const send = snsClient.send as jest.Mock;

const buildRecord = (
  overrides: Partial<SQSEvent['Records'][number]> = {},
): SQSEvent['Records'][number] =>
  ({
    messageId: 'msg-1',
    body: JSON.stringify({
      token: 'arn:aws:sns:us-east-1:123456789012:endpoint/APNS/app/device-1',
      channel: 'apns',
      payload: { title: 'Weekly summary', body: 'You logged 3 migraines this week' },
      metadata: { appVersion: '1.2.3' },
    }),
    ...overrides,
  }) as SQSEvent['Records'][number];

describe('notification-queue-consumer handler', () => {
  afterEach(() => {
    send.mockReset();
    (logger.error as jest.Mock).mockReset();
    (Sentry.captureException as jest.Mock).mockReset();
    (Sentry.flush as jest.Mock).mockClear();
  });

  it('publishes to SNS for every record and reports no failures', async () => {
    send.mockResolvedValue({});
    const event = {
      Records: [buildRecord({ messageId: 'msg-1' }), buildRecord({ messageId: 'msg-2' })],
    };

    const result = await handler(event as SQSEvent);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toBeInstanceOf(PublishCommand);
    expect(send.mock.calls[0][0].input).toEqual({
      TargetArn: 'arn:aws:sns:us-east-1:123456789012:endpoint/APNS/app/device-1',
      Message: JSON.stringify({
        title: 'Weekly summary',
        body: 'You logged 3 migraines this week',
      }),
    });
    expect(result).toEqual({ batchItemFailures: [] });
  });

  it('reports the failing message as a batch item failure without failing the whole batch', async () => {
    send.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('sns unavailable'));
    const event = {
      Records: [buildRecord({ messageId: 'msg-1' }), buildRecord({ messageId: 'msg-2' })],
    };

    const result = await handler(event as SQSEvent);

    expect(result).toEqual({ batchItemFailures: [{ itemIdentifier: 'msg-2' }] });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'msg-2' }),
      'Failed to dispatch push notification from NOTIFICATION_QUEUE',
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.flush).toHaveBeenCalledWith(2000);
  });

  it('reports malformed message bodies as batch item failures', async () => {
    const event = { Records: [buildRecord({ messageId: 'msg-bad', body: 'not-json' })] };

    const result = await handler(event as SQSEvent);

    expect(result).toEqual({ batchItemFailures: [{ itemIdentifier: 'msg-bad' }] });
    expect(send).not.toHaveBeenCalled();
  });

  it('does not flush Sentry when there are no failures', async () => {
    send.mockResolvedValue({});
    const event = { Records: [buildRecord()] };

    await handler(event as SQSEvent);

    expect(Sentry.flush).not.toHaveBeenCalled();
  });

  it('returns an empty batchItemFailures array for an empty batch', async () => {
    const result = await handler({ Records: [] } as unknown as SQSEvent);

    expect(result).toEqual({ batchItemFailures: [] });
    expect(send).not.toHaveBeenCalled();
  });
});
