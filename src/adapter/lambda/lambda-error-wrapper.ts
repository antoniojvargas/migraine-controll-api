import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import * as Sentry from '@sentry/node';
import { logger } from '@/config/logger';

export type LambdaHttpHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

const INTERNAL_ERROR_RESPONSE = {
  statusCode: 500,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  }),
};

export const withErrorWrapper = (domain: string, handler: LambdaHttpHandler): LambdaHttpHandler => {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (err) {
      logger.error(
        {
          err,
          domain,
          requestId: context.awsRequestId,
          path: event.rawPath,
          method: event.requestContext?.http?.method,
        },
        'Unhandled Lambda error',
      );
      Sentry.captureException(err, {
        tags: { domain },
        extra: {
          requestId: context.awsRequestId,
          path: event.rawPath,
          method: event.requestContext?.http?.method,
        },
      });
      await Sentry.flush(2000);
      return INTERNAL_ERROR_RESPONSE;
    }
  };
};
