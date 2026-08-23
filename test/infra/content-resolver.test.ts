import { GetObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { s3Client } from '@/infra/aws/s3Client';
import { parseS3Uri, resolveContent } from '@/infra/aws/content-resolver';

jest.mock('@/infra/aws/s3Client', () => ({
  s3Client: { send: jest.fn() },
}));
jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

const send = s3Client.send as jest.Mock;

describe('parseS3Uri', () => {
  it('extracts the bucket and key from an s3:// URI', () => {
    expect(parseS3Uri('s3://my-bucket/path/to/object.pem')).toEqual({
      bucket: 'my-bucket',
      key: 'path/to/object.pem',
    });
  });

  it('throws for a malformed URI', () => {
    expect(() => parseS3Uri('not-an-s3-uri')).toThrow('Invalid S3 URI: not-an-s3-uri');
  });
});

describe('resolveContent', () => {
  afterEach(() => {
    send.mockReset();
    (readFile as jest.Mock).mockReset();
  });

  it('resolves content from an explicit bucket/key pair', async () => {
    send.mockResolvedValueOnce({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    });

    const result = await resolveContent({ type: 's3', bucket: 'my-bucket', key: 'ca.pem' });

    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: 'my-bucket', Key: 'ca.pem' });
    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });

  it('resolves content from an s3:// URI', async () => {
    send.mockResolvedValueOnce({
      Body: { transformToByteArray: async () => new Uint8Array([4, 5]) },
    });

    const result = await resolveContent({ type: 's3Uri', uri: 's3://my-bucket/ca.pem' });

    expect(send.mock.calls[0][0].input).toEqual({ Bucket: 'my-bucket', Key: 'ca.pem' });
    expect(result).toEqual(Buffer.from([4, 5]));
  });

  it('resolves content from a local file', async () => {
    (readFile as jest.Mock).mockResolvedValueOnce(Buffer.from('local-content'));

    const result = await resolveContent({ type: 'file', path: '/tmp/ca.pem' });

    expect(readFile).toHaveBeenCalledWith('/tmp/ca.pem');
    expect(result).toEqual(Buffer.from('local-content'));
  });

  it('throws when the S3 object body is empty', async () => {
    send.mockResolvedValueOnce({ Body: undefined });

    await expect(
      resolveContent({ type: 's3', bucket: 'my-bucket', key: 'ca.pem' }),
    ).rejects.toThrow('Empty S3 object body: s3://my-bucket/ca.pem');
  });
});
