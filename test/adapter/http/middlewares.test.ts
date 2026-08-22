import Fastify, { FastifyInstance } from 'fastify';
import { AppError } from '@/utils/app-error';
import { DomainError } from '@/domain/domain-error';
import { buildApp } from '@/factory/build-app';
import { registerErrorHandler, toErrorPayload } from '@/adapter/http/error-handler';
import { getRequestLogContext, requestLogMixin } from '@/config/request-log-context';

describe('cross-cutting middlewares', () => {
  describe('request-id / correlation-id + CORS on the real app', () => {
    it('propagates the request id into the async log context', async () => {
      const app = buildApp();
      app.get('/whoami', async () => ({ context: getRequestLogContext() }));
      const response = await app.inject({
        method: 'GET',
        url: '/whoami',
        headers: { 'x-request-id': 'trace-42' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        context: { requestId: 'trace-42', correlationId: 'trace-42' },
      });
    });

    it('leaves the log context empty outside of requests', () => {
      expect(getRequestLogContext()).toBeUndefined();
      expect(requestLogMixin()).toEqual({});
    });
    it('generates and echoes request id headers', async () => {
      const response = await buildApp().inject({ method: 'GET', url: '/health' });
      expect(response.statusCode).toBe(200);
      const requestId = response.headers['x-request-id'];
      expect(typeof requestId).toBe('string');
      expect((requestId as string).length).toBeGreaterThan(0);
      expect(response.headers['x-correlation-id']).toBe(requestId);
    });

    it('honors an incoming x-request-id', async () => {
      const response = await buildApp().inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-request-id': 'trace-123' },
      });
      expect(response.headers['x-request-id']).toBe('trace-123');
      expect(response.headers['x-correlation-id']).toBe('trace-123');
    });

    it('sets CORS headers on regular responses', async () => {
      const response = await buildApp().inject({ method: 'GET', url: '/health' });
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-headers']).toContain('x-user-id');
    });

    it('answers OPTIONS preflight with 204 and CORS headers', async () => {
      const response = await buildApp().inject({ method: 'OPTIONS', url: '/health' });
      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(Number(response.headers['access-control-max-age'])).toBeGreaterThan(0);
    });

    it('reflects allowed origins from an allowlist and adds Vary: Origin', async () => {
      const app = buildApp({
        cors: { origin: ['https://app.example.com'], credentials: true },
      });
      const allowed = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { origin: 'https://app.example.com' },
      });
      expect(allowed.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(allowed.headers['access-control-allow-credentials']).toBe('true');
      expect(allowed.headers.vary).toBe('Origin');

      const denied = await app.inject({
        method: 'GET',
        url: '/health',
        headers: { origin: 'https://evil.example.com' },
      });
      expect(denied.headers['access-control-allow-origin']).toBeUndefined();
      expect(denied.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('keeps a fixed origin static without Vary', async () => {
      const response = await buildApp({ cors: { origin: 'https://app.example.com' } }).inject({
        method: 'GET',
        url: '/health',
        headers: { origin: 'https://other.example.com' },
      });
      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(response.headers.vary).toBeUndefined();
    });
  });

  describe('rate limiting', () => {
    it('returns 429 with Retry-After once the window budget is exhausted', async () => {
      const app = buildApp({ rateLimit: { max: 2, windowMs: 60_000 } });
      app.get('/ping', async () => ({ status: 'pong' }));
      const first = await app.inject({ method: 'GET', url: '/ping' });
      const second = await app.inject({ method: 'GET', url: '/ping' });
      const third = await app.inject({ method: 'GET', url: '/ping' });

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(third.statusCode).toBe(429);
      expect(third.json()).toMatchObject({ code: 'RATE_LIMITED' });
      expect(Number(third.headers['retry-after'])).toBeGreaterThanOrEqual(1);
    });

    it('exposes standard X-RateLimit headers that decrease per request', async () => {
      const app = buildApp({ rateLimit: { max: 5, windowMs: 60_000 } });
      app.get('/ping', async () => ({ status: 'pong' }));
      const first = await app.inject({ method: 'GET', url: '/ping' });
      const second = await app.inject({ method: 'GET', url: '/ping' });

      expect(first.headers['x-ratelimit-limit']).toBe('5');
      expect(first.headers['x-ratelimit-remaining']).toBe('4');
      expect(Number(first.headers['x-ratelimit-reset'])).toBeGreaterThan(
        Math.floor(Date.now() / 1000),
      );
      expect(second.headers['x-ratelimit-remaining']).toBe('3');
    });

    it('does not count skipped requests against the budget', async () => {
      const app = buildApp({
        rateLimit: { max: 1, windowMs: 60_000, skip: () => true },
      });
      for (let i = 0; i < 3; i += 1) {
        const response = await app.inject({ method: 'GET', url: '/health' });
        expect(response.statusCode).toBe(200);
      }
    });

    it('keeps /health exempt from the default limit in buildApp', async () => {
      const app = buildApp({ rateLimit: { max: 1, windowMs: 60_000 } });
      for (let i = 0; i < 5; i += 1) {
        const response = await app.inject({ method: 'GET', url: '/health' });
        expect(response.statusCode).toBe(200);
      }
      const other = await app.inject({ method: 'GET', url: '/anything-else' });
      const exhausted = await app.inject({ method: 'GET', url: '/anything-else' });
      expect(other.statusCode).toBe(404);
      expect(exhausted.statusCode).toBe(429);
    });
  });

  describe('docs', () => {
    it('serves the Swagger UI HTML page in non production environments', async () => {
      const response = await buildApp().inject({ method: 'GET', url: '/docs' });
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain('SwaggerUIBundle');
      expect(response.body).toContain('/docs/openapi.yml');
    });

    it('serves the raw OpenAPI spec with all documented paths', async () => {
      const response = await buildApp().inject({ method: 'GET', url: '/docs/openapi.yml' });
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/yaml');
      for (const path of [
        '/health:',
        '/app-version:',
        '/users/{userId}/preferred-answers:',
        '/users/{userId}/preferred-answers/{questionId}:',
        '/acute-treatment-worse-feedback-options:',
      ]) {
        expect(response.body).toContain(path);
      }
    });

    it('does not expose docs when explicitly disabled (production)', async () => {
      const app = buildApp({ docs: { enabled: false } });
      const html = await app.inject({ method: 'GET', url: '/docs' });
      const spec = await app.inject({ method: 'GET', url: '/docs/openapi.yml' });
      expect(html.statusCode).toBe(404);
      expect(spec.statusCode).toBe(404);
    });
  });

  describe('global error handler', () => {
    const buildFailingApp = (handler: () => never): FastifyInstance => {
      const app = Fastify({ logger: false }) as unknown as FastifyInstance;
      registerErrorHandler(app);
      app.get('/boom', async () => handler());
      return app;
    };

    it('maps AppError to its own status, code and message', async () => {
      const response = await buildFailingApp(() => {
        throw new AppError(409, 'CONFLICT', 'Resource already exists');
      }).inject({ method: 'GET', url: '/boom' });
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({
        statusCode: 409,
        code: 'CONFLICT',
        message: 'Resource already exists',
      });
    });

    it('maps DomainError to 400 DOMAIN_VALIDATION_ERROR', async () => {
      const response = await buildFailingApp(() => {
        throw new DomainError('bad input');
      }).inject({ method: 'GET', url: '/boom' });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        statusCode: 400,
        code: 'DOMAIN_VALIDATION_ERROR',
        message: 'bad input',
      });
    });

    it('hides internals for unknown errors with a generic 500', async () => {
      const response = await buildFailingApp(() => {
        throw new Error('secret db credentials leaked');
      }).inject({ method: 'GET', url: '/boom' });
      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
    });

    it('passes through client errors carrying their own statusCode (<500)', async () => {
      const response = await buildFailingApp((() => {
        const error = new Error('malformed json') as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
      }) as () => never).inject({ method: 'GET', url: '/boom' });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ statusCode: 400, message: 'malformed json' });
    });
  });

  describe('toErrorPayload', () => {
    it('keeps AppError data untouched', () => {
      expect(toErrorPayload(new AppError(418, 'TEAPOT', 'short and stout'))).toEqual({
        statusCode: 418,
        code: 'TEAPOT',
        message: 'short and stout',
      });
    });
  });
});
