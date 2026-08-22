import { FastifyInstance, FastifyRequest } from 'fastify';

export interface CorsOptions {
  origin?: string | string[];
  credentials?: boolean;
  methods?: string;
  allowedHeaders?: string;
  maxAge?: number;
}

const DEFAULT_ALLOWED_HEADERS = 'content-type,x-user-id,x-request-id,x-correlation-id';

const WILDCARD = '*';

export const resolveAllowOrigin = (
  configured: string | string[],
  request: FastifyRequest,
): { value?: string; vary: boolean } => {
  if (Array.isArray(configured)) {
    const requestOrigin = request.headers.origin;
    if (typeof requestOrigin === 'string' && configured.includes(requestOrigin)) {
      return { value: requestOrigin, vary: true };
    }
    return { vary: true };
  }
  if (configured !== WILDCARD) {
    return { value: configured, vary: false };
  }
  return { value: WILDCARD, vary: false };
};

export const registerCors = (app: FastifyInstance, options: CorsOptions = {}): void => {
  const origin = options.origin ?? WILDCARD;
  const credentials = options.credentials ?? false;
  const methods = options.methods ?? 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  const allowedHeaders = options.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS;
  const maxAge = options.maxAge ?? 86400;

  app.addHook('onRequest', async (request, reply) => {
    const allowOrigin = resolveAllowOrigin(origin, request);
    if (allowOrigin.value !== undefined) {
      reply.header('Access-Control-Allow-Origin', allowOrigin.value);
      if (credentials) {
        reply.header('Access-Control-Allow-Credentials', 'true');
      }
    }
    if (allowOrigin.vary) {
      reply.header('Vary', 'Origin');
    }
    reply.header('Access-Control-Allow-Methods', methods);
    reply.header('Access-Control-Allow-Headers', allowedHeaders);
    if (request.method === 'OPTIONS') {
      reply.header('Access-Control-Max-Age', maxAge);
      await reply.status(204).send();
    }
  });
};
