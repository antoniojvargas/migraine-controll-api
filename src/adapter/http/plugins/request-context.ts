import { randomUUID } from 'crypto';
import { IncomingHttpHeaders } from 'http';
import { FastifyInstance } from 'fastify';
import { enterRequestLogContext } from '@/config/request-log-context';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

interface HeaderedRequest {
  headers: IncomingHttpHeaders;
}

export type GenReqId = (request: HeaderedRequest) => string;

export const createGenReqId = (fallback: () => string = randomUUID): GenReqId => {
  return (request) => {
    const incoming = request.headers[REQUEST_ID_HEADER];
    if (typeof incoming === 'string' && incoming.trim().length > 0) {
      return incoming.trim();
    }
    return fallback();
  };
};

export const registerRequestContext = (app: FastifyInstance): void => {
  app.addHook('onRequest', async (request, reply) => {
    const requestId = request.id;
    enterRequestLogContext({ requestId, correlationId: requestId });
    reply.header(REQUEST_ID_HEADER, requestId);
    reply.header(CORRELATION_ID_HEADER, requestId);
  });
};
