import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3DataProcessor } from '@/infra/processors/s3-data-processor';
import { TerraIngestionPayload } from '@/infra/processors/data-processor.interface';

describe('S3DataProcessor', () => {
  const buildPayload = (): TerraIngestionPayload => ({
    terraUserId: 'terra-1',
    dataType: 'sleep',
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-08-01T08:00:00.000Z'),
    receivedAt: new Date('2026-08-01T08:05:00.000Z'),
    data: { score: 80 },
  });

  it('is disabled when no bucket is configured', () => {
    const s3Client = { send: jest.fn() } as unknown as jest.Mocked<S3Client>;
    expect(new S3DataProcessor(s3Client, '').isEnabled()).toBe(false);
    expect(new S3DataProcessor(s3Client, 'my-bucket').isEnabled()).toBe(true);
  });

  it('uploads the raw payload under the structured key terra-payloads/YYYY-MM-DD/data_type/user_id-timestamp.json', async () => {
    const s3Client = { send: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<S3Client>;
    const payload = buildPayload();

    await new S3DataProcessor(s3Client, 'my-bucket').process(payload);

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    const command = s3Client.send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'my-bucket',
      Key: `terra-payloads/2026-08-01/sleep/terra-1-${payload.receivedAt.getTime()}.json`,
      Body: JSON.stringify(payload.data),
      ContentType: 'application/json',
    });
  });
});
