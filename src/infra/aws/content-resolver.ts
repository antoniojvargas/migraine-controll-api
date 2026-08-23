import { GetObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { s3Client } from '@/infra/aws/s3Client';

export type ContentSource =
  | { type: 's3'; bucket: string; key: string }
  | { type: 's3Uri'; uri: string }
  | { type: 'file'; path: string };

export const parseS3Uri = (uri: string): { bucket: string; key: string } => {
  const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (match === null) {
    throw new Error(`Invalid S3 URI: ${uri}`);
  }
  const [, bucket, key] = match;
  return { bucket, key };
};

const getObject = async (bucket: string, key: string): Promise<Buffer> => {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await response.Body?.transformToByteArray();
  if (bytes === undefined) {
    throw new Error(`Empty S3 object body: s3://${bucket}/${key}`);
  }
  return Buffer.from(bytes);
};

export const resolveContent = async (source: ContentSource): Promise<Buffer> => {
  switch (source.type) {
    case 's3':
      return getObject(source.bucket, source.key);
    case 's3Uri': {
      const { bucket, key } = parseS3Uri(source.uri);
      return getObject(bucket, key);
    }
    case 'file':
      return readFile(source.path);
  }
};
