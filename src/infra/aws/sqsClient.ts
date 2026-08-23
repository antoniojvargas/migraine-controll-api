import { SQSClient } from '@aws-sdk/client-sqs';
import { envs } from '@/config/env';

export const sqsClient = new SQSClient({ region: envs.AWS_REGION });
