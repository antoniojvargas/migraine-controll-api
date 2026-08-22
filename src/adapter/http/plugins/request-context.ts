import { randomUUID } from 'crypto';
import { IncomingHttpHeaders } from 'http';
import { FastifyInstance } from 'fastify';

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
  app.addHook('onRequest', async (_request, reply) => {
    reply.header(REQUEST_ID_HEADER, _request.id);
    reply.header(CORRELATION_ID_HEADER, _request.id);
  });
};
