import { DomainError } from '@/domain/domain-error';
import { AppError } from './app-error';

export function handleErrorResponse(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }
  if (error instanceof DomainError) {
    throw new AppError(400, 'DOMAIN_VALIDATION_ERROR', error.message);
  }
  const code = getDatabaseErrorCode(error);
  if (code === '23505') {
    throw new AppError(409, 'CONFLICT', 'Resource already exists');
  }
  if (code === '23503') {
    throw new AppError(400, 'INVALID_REFERENCE', 'Referenced resource does not exist');
  }
  throw new AppError(500, 'INTERNAL_ERROR', 'Internal server error');
}

function getDatabaseErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: unknown }).code as string | null;
  }
  return null;
}
