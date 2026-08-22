import { FastifyInstance } from 'fastify';

export interface CorsOptions {
  origin?: string;
  methods?: string;
  allowedHeaders?: string;
  maxAge?: number;
}

const DEFAULT_ALLOWED_HEADERS = 'content-type,x-user-id,x-request-id,x-correlation-id';

export const registerCors = (app: FastifyInstance, options: CorsOptions = {}): void => {
  const origin = options.origin ?? '*';
  const methods = options.methods ?? 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  const allowedHeaders = options.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS;
  const maxAge = options.maxAge ?? 86400;

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Access-Control-Allow-Methods', methods);
    reply.header('Access-Control-Allow-Headers', allowedHeaders);
    if (request.method === 'OPTIONS') {
      reply.header('Access-Control-Max-Age', maxAge);
      await reply.status(204).send();
    }
  });
};
