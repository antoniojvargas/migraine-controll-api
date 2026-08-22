import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@/utils/app-error';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { UserEntity } from '@/infra/database/entities';

export enum ErrorMessages {
  VALIDATION_ERROR = 'Validation error',
  UNAUTHORIZED = 'Missing or invalid user identification',
  NOT_FOUND = 'Resource not found',
  INTERNAL_ERROR = 'Internal server error',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const USER_ID_HEADER = 'x-user-id';

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
    handleErrorResponse(error);
    throw error;
  }
}

export function handleSuccessResponse<T>(
  reply: FastifyReply,
  statusCode: number,
  data?: T,
): FastifyReply {
  return reply.status(statusCode).send(data ?? null);
}

export async function resolveRequestUser(
  request: FastifyRequest,
  userRepository: UserRepository,
): Promise<UserEntity> {
  const headerValue = request.headers[USER_ID_HEADER];
  const userId = typeof headerValue === 'string' ? headerValue.trim() : '';
  if (UUID_REGEX.test(userId) === false) {
    throw new AppError(401, 'UNAUTHORIZED', ErrorMessages.UNAUTHORIZED);
  }
  const user = await userRepository.findOneBy({ id: userId });
  if (user === null) {
    throw new AppError(401, 'UNAUTHORIZED', ErrorMessages.UNAUTHORIZED);
  }
  return user;
}
