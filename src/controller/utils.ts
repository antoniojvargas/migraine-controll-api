import { FastifyReply } from 'fastify';
import { AppError } from '@/utils/app-error';
import { handleErrorResponse } from '@/utils/handle-error-response';

export interface RequestSchema<T> {
  validate(data: unknown): { value: T; error?: { message: string } };
}

export function validateRequest<T>(schema: RequestSchema<T>, data: unknown): T {
  const { value, error } = schema.validate(data);
  if (error !== undefined) {
    throw new AppError(400, 'VALIDATION_ERROR', error.message);
  }
  return value;
}

export interface ControllerResult {
  statusCode?: number;
  data?: unknown;
}

export async function executeController(
  reply: FastifyReply,
  action: () => Promise<ControllerResult>,
): Promise<FastifyReply> {
  try {
    const result = await action();
    return handleSuccessResponse(reply, result.statusCode ?? 200, result.data);
  } catch (error) {
    // handleErrorResponse always throws (returns `never`); it normalizes the
    // error to an AppError which the Fastify error handler then serializes.
    handleErrorResponse(error);
  }
}

export function handleSuccessResponse<T>(
  reply: FastifyReply,
  statusCode: number,
  data?: T,
): FastifyReply {
  return reply.status(statusCode).send(data ?? null);
}
