import { FastifyReply } from 'fastify';
import { AppError } from '@/utils/app-error';
import { DomainError } from '@/domain/domain-error';
import { executeController, RequestSchema, validateRequest } from '@/controller/utils';

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
});
