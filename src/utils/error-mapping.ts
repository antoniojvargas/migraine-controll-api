import { DomainError } from '@/domain/domain-error';
import { AppError } from './app-error';

export interface ErrorPayload {
  statusCode: number;
  code: string;
  message: string;
}

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

const getDatabaseErrorCode = (error: unknown): string | null => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: unknown }).code as string | null;
  }
  return null;
};

/**
 * Clasifica los tipos de error conocidos en toda la app a un payload
 * normalizado `{ statusCode, code, message }`. Devuelve `null` para errores no
 * reconocidos, para que cada borde decida su fallback: los casos de uso lo
 * traducen a un 500 genérico (ver `handle-error-response.ts`), el error handler
 * HTTP deja pasar los errores de cliente con `statusCode < 500`
 * (ver `adapter/http/error-handler.ts`).
 */
export const classifyError = (error: unknown): ErrorPayload | null => {
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  if (error instanceof DomainError) {
    return { statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR', message: error.message };
  }
  const pgCode = getDatabaseErrorCode(error);
  if (pgCode === PG_UNIQUE_VIOLATION) {
    return { statusCode: 409, code: 'CONFLICT', message: 'Resource already exists' };
  }
  if (pgCode === PG_FOREIGN_KEY_VIOLATION) {
    return {
      statusCode: 400,
      code: 'INVALID_REFERENCE',
      message: 'Referenced resource does not exist',
    };
  }
  return null;
};
