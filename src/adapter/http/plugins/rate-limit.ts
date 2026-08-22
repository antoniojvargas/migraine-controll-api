import { FastifyInstance, FastifyRequest } from 'fastify';

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (request: FastifyRequest) => string;
  skip?: (request: FastifyRequest) => boolean;
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
  const skip = options.skip ?? (() => false);
  const buckets = new Map<string, Bucket>();

  app.addHook('onRequest', async (request, reply) => {
    const now = Date.now();
    if (buckets.size >= MAX_BUCKETS) {
      prune(buckets, now);
    }
    if (skip(request)) {
      return;
    }
    const key = keyGenerator(request);
    let bucket = buckets.get(key);
    if (bucket === undefined || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    reply.header('X-RateLimit-Limit', max);
    reply.header('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    reply.header('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

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
