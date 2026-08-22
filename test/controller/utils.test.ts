import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@/utils/app-error';
import { DomainError } from '@/domain/domain-error';
import {
  ErrorMessages,
  executeController,
  RequestSchema,
  resolveRequestUser,
  USER_ID_HEADER,
  validateRequest,
} from '@/controller/utils';
import { UserRepository } from '@/infra/database/repository/user.repository';

describe('controller/utils', () => {
  describe('validateRequest', () => {
    const schema: RequestSchema<{ name: string }> = {
      validate(data: unknown) {
        const record = data as Record<string, unknown>;
        if (typeof record.name !== 'string') {
          return { value: {} as { name: string }, error: { message: 'name is required' } };
        }
        return { value: { name: record.name } };
      },
    };

    it('returns the parsed value when validation passes', () => {
      expect(validateRequest(schema, { name: 'dev' })).toEqual({ name: 'dev' });
    });

    it('throws AppError 400 VALIDATION_ERROR when validation fails', () => {
      expect(() => validateRequest(schema, {})).toThrow(AppError);
      try {
        validateRequest(schema, {});
      } catch (error) {
        const appError = error as AppError;
        expect(appError.statusCode).toBe(400);
        expect(appError.code).toBe('VALIDATION_ERROR');
        expect(appError.message).toBe('name is required');
      }
    });
  });

  describe('executeController', () => {
    const reply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as FastifyReply;

    it('sends the action data with default status 200', async () => {
      await executeController(reply, async () => ({ data: { hello: 'world' } }));
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({ hello: 'world' });
    });

    it('honors a custom statusCode from the result', async () => {
      await executeController(reply, async () => ({ statusCode: 201, data: { id: '1' } }));
      expect(reply.status).toHaveBeenCalledWith(201);
    });

    it('normalizes unknown errors through handleErrorResponse', async () => {
      await expect(
        executeController(reply, async () => {
          throw new Error('boom');
        }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it('rethrows DomainError as 400 DOMAIN_VALIDATION_ERROR', async () => {
      await expect(
        executeController(reply, async () => {
          throw new DomainError('bad input');
        }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
    });
  });

  describe('resolveRequestUser', () => {
    const USER_ID = '11111111-1111-1111-1111-111111111111';
    const buildRequest = (headers: Record<string, string | undefined>): FastifyRequest =>
      ({ headers }) as unknown as FastifyRequest;
    const userRepository = {
      findOneBy: jest.fn(async (criteria: { id: string }) =>
        criteria.id === USER_ID ? ({ id: USER_ID } as never) : null,
      ),
    } as unknown as UserRepository;

    it('resolves the user from the x-user-id header', async () => {
      const user = await resolveRequestUser(
        buildRequest({ [USER_ID_HEADER]: USER_ID }),
        userRepository,
      );
      expect(user).toMatchObject({ id: USER_ID });
    });

    it('throws 401 when the header is missing or malformed', async () => {
      await expect(resolveRequestUser(buildRequest({}), userRepository)).rejects.toMatchObject({
        statusCode: 401,
        message: ErrorMessages.UNAUTHORIZED,
      });
      await expect(
        resolveRequestUser(buildRequest({ [USER_ID_HEADER]: 'not-a-uuid' }), userRepository),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 when the user does not exist', async () => {
      await expect(
        resolveRequestUser(
          buildRequest({ [USER_ID_HEADER]: '00000000-0000-0000-0000-000000000000' }),
          userRepository,
        ),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
