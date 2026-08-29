import { AppError } from './app-error';
import { classifyError } from './error-mapping';

/**
 * Traduce cualquier error lanzado a un `AppError`. Se usa en los bordes de capa
 * (controllers y casos de uso). Los errores no reconocidos se ocultan tras un
 * 500 genérico para no filtrar detalles internos.
 */
export function handleErrorResponse(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }
  const classified = classifyError(error);
  if (classified !== null) {
    throw new AppError(classified.statusCode, classified.code, classified.message);
  }
  throw new AppError(500, 'INTERNAL_ERROR', 'Internal server error');
}
