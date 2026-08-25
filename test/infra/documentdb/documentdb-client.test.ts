import { S3Client } from '@aws-sdk/client-s3';

jest.mock('fs', () => ({ existsSync: jest.fn() }));
jest.mock('fs/promises', () => ({ writeFile: jest.fn().mockResolvedValue(undefined) }));

const connect = jest.fn().mockResolvedValue(undefined);
const close = jest.fn().mockResolvedValue(undefined);
const MongoClientMock = jest.fn().mockImplementation(() => ({ connect, close }));
jest.mock('mongodb', () => ({ MongoClient: MongoClientMock }));

import { existsSync } from 'fs';
import { DocumentDbClient, DocumentDbClientConfig } from '@/infra/documentdb/documentdb-client';

describe('DocumentDbClient', () => {
  const buildConfig = (): DocumentDbClientConfig => ({
    connectionUri: 'mongodb://cluster.docdb.amazonaws.com:27017',
    caBundleBucket: 'ca-bundles-bucket',
    caBundleKey: 'global-bundle.pem',
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

  it('downloads the CA bundle from S3 when not cached locally and connects', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    const s3Client = buildS3Client();
    const client = new DocumentDbClient(s3Client, buildConfig());

    await client.getClient();

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('reuses the cached CA bundle path and mongo client on subsequent calls', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const s3Client = buildS3Client();
    const client = new DocumentDbClient(s3Client, buildConfig());

    await client.getClient();
    await client.getClient();

    expect(s3Client.send).not.toHaveBeenCalled();
    expect(MongoClientMock).toHaveBeenCalledTimes(1);
  });

  it('closes the underlying mongo client and allows reconnecting', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const client = new DocumentDbClient(buildS3Client(), buildConfig());

    await client.getClient();
    await client.close();
    await client.close();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
