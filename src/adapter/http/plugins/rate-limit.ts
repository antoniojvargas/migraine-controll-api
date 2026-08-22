import { FastifyInstance, FastifyRequest } from 'fastify';

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (request: FastifyRequest) => string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;

const prune = (buckets: Map<string, Bucket>, now: number): void => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export const registerRateLimit = (app: FastifyInstance, options: RateLimitOptions = {}): void => {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 100;
  const keyGenerator = options.keyGenerator ?? ((request: FastifyRequest) => request.ip);
  const buckets = new Map<string, Bucket>();

  app.addHook('onRequest', async (request, reply) => {
    const now = Date.now();
    if (buckets.size >= MAX_BUCKETS) {
      prune(buckets, now);
    }
    const key = keyGenerator(request);
    const bucket = buckets.get(key);
    if (bucket === undefined || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    bucket.count += 1;
    if (bucket.count > max) {
      await reply
        .status(429)
        .header('Retry-After', Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)))
        .send({
          statusCode: 429,
          code: 'RATE_LIMITED',
          message: 'Too many requests',
        });
    }
  });
};
