import { S3Client } from '@aws-sdk/client-s3';

jest.mock('fs', () => ({ existsSync: jest.fn() }));
jest.mock('fs/promises', () => ({ writeFile: jest.fn().mockResolvedValue(undefined) }));

const insertOne = jest.fn().mockResolvedValue({});
const collection = jest.fn().mockReturnValue({ insertOne });
const db = jest.fn().mockReturnValue({ collection });
const connect = jest.fn().mockResolvedValue(undefined);
const close = jest.fn().mockResolvedValue(undefined);
const MongoClientMock = jest.fn().mockImplementation(() => ({ connect, db, close }));
jest.mock('mongodb', () => ({ MongoClient: MongoClientMock }));

import { existsSync } from 'fs';
import {
  DocumentDBDataProcessor,
  DocumentDBDataProcessorConfig,
} from '@/infra/processors/document-db-data-processor';
import { TerraIngestionPayload } from '@/infra/processors/data-processor.interface';

describe('DocumentDBDataProcessor', () => {
  const buildConfig = (
    overrides: Partial<DocumentDBDataProcessorConfig> = {},
  ): DocumentDBDataProcessorConfig => ({
    enabled: true,
    connectionUri: 'mongodb://cluster.docdb.amazonaws.com:27017',
    databaseName: 'terra',
    collectionName: 'health_data',
    caBundleBucket: 'ca-bundles-bucket',
    caBundleKey: 'global-bundle.pem',
    ...overrides,
  });

  const buildPayload = (): TerraIngestionPayload => ({
    terraUserId: 'terra-1',
    dataType: 'sleep',
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-08-01T08:00:00.000Z'),
    receivedAt: new Date('2026-08-01T08:05:00.000Z'),
    data: { score: 80 },
  });

  const buildS3Client = (): jest.Mocked<S3Client> =>
    ({
      send: jest.fn().mockResolvedValue({
        Body: { transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])) },
      }),
    }) as unknown as jest.Mocked<S3Client>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is disabled without a connection URI even if the flag is on', () => {
    const processor = new DocumentDBDataProcessor(
      buildS3Client(),
      buildConfig({ connectionUri: '' }),
    );
    expect(processor.isEnabled()).toBe(false);
  });

  it('is disabled when the enabled flag is off', () => {
    const processor = new DocumentDBDataProcessor(buildS3Client(), buildConfig({ enabled: false }));
    expect(processor.isEnabled()).toBe(false);
  });

  it('downloads the CA bundle from S3 once and connects the Mongo client', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    const s3Client = buildS3Client();
    const processor = new DocumentDBDataProcessor(s3Client, buildConfig());

    await processor.process(buildPayload());
    await processor.process(buildPayload());

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    expect(MongoClientMock).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(insertOne).toHaveBeenCalledTimes(2);
  });

  it('reuses the CA bundle already cached on disk', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const s3Client = buildS3Client();
    const processor = new DocumentDBDataProcessor(s3Client, buildConfig());

    await processor.process(buildPayload());

    expect(s3Client.send).not.toHaveBeenCalled();
  });

  it('inserts the payload into the configured database and collection', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const payload = buildPayload();
    const processor = new DocumentDBDataProcessor(buildS3Client(), buildConfig());

    await processor.process(payload);

    expect(db).toHaveBeenCalledWith('terra');
    expect(collection).toHaveBeenCalledWith('health_data');
    expect(insertOne).toHaveBeenCalledWith({
      terraUserId: 'terra-1',
      dataType: 'sleep',
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      receivedAt: payload.receivedAt,
      data: payload.data,
    });
  });

  it('closes the underlying client and clears it', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const processor = new DocumentDBDataProcessor(buildS3Client(), buildConfig());
    await processor.process(buildPayload());

    await processor.close();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
