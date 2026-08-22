import { AppError } from '@/utils/app-error';
import { DomainError } from '@/domain/domain-error';
import { FastifyInstance } from 'fastify';

export interface ErrorPayload {
  statusCode: number;
  code: string;
  message: string;
}

interface FastifyLikeError {
  statusCode?: number;
  code?: string;
  message?: string;
}

export const toErrorPayload = (error: unknown): ErrorPayload => {
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  if (error instanceof DomainError) {
    return { statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR', message: error.message };
  }
  const candidate = error as FastifyLikeError | undefined;
  const statusCode =
    typeof candidate?.statusCode === 'number' && candidate.statusCode < 500
      ? candidate.statusCode
      : 500;
  if (statusCode === 500) {
    return { statusCode, code: 'INTERNAL_ERROR', message: 'Internal server error' };
  }
  return {
    statusCode,
    code: typeof candidate?.code === 'string' ? candidate.code : 'REQUEST_ERROR',
    message: typeof candidate?.message === 'string' ? candidate.message : 'Request error',
  };
};

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, request, reply) => {
    const payload = toErrorPayload(error);
    if (payload.statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled request error');
    }
    void reply.status(payload.statusCode).send(payload);
  });
};
