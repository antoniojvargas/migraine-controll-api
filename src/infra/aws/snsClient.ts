import { SNSClient } from '@aws-sdk/client-sns';
import { envs } from '@/config/env';

export const snsClient = new SNSClient({ region: envs.AWS_REGION });
