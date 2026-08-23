import { S3Client } from '@aws-sdk/client-s3';
import { envs } from '@/config/env';

export const s3Client = new S3Client({ region: envs.AWS_REGION });
