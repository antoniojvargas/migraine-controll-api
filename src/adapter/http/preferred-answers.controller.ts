import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController, RequestSchema, validateRequest } from '@/controller/utils';
import { AppError } from '@/utils/app-error';
import { UpsertPreferredAnswerUc } from '@/usecase/upsert-preferred-answer.uc';
import { FindPreferredAnswersByUserUc } from '@/usecase/find-preferred-answers-by-user.uc';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PreferredAnswerBody {
  selectionId?: string;
  answerText?: string;
}

const preferredAnswerBodySchema: RequestSchema<PreferredAnswerBody> = {
  validate(data: unknown) {
    const body = (data ?? {}) as Record<string, unknown>;
    if (
      body.selectionId === undefined &&
      (body.answerText === undefined || typeof body.answerText !== 'string')
    ) {
      return {
        value: {},
        error: { message: 'answerText is required when selectionId is not provided' },
      };
    }
    if (
      body.selectionId !== undefined &&
      (typeof body.selectionId !== 'string' || UUID_REGEX.test(body.selectionId) === false)
    ) {
      return { value: {}, error: { message: 'selectionId must be a valid uuid' } };
    }
    return {
      value: {
        selectionId: body.selectionId as string | undefined,
        answerText: body.answerText as string | undefined,
      },
    };
  },
};

const requireUuidParam = (value: string | undefined, field: string): string => {
  if (value === undefined || UUID_REGEX.test(value) === false) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be a valid uuid`);
  }
  return value;
};

export class PreferredAnswersController {
  constructor(
    private readonly upsertPreferredAnswerUc: UpsertPreferredAnswerUc,
    private readonly findPreferredAnswersByUserUc: FindPreferredAnswersByUserUc,
  ) {}

  findByUser = async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const userId = requireUuidParam(request.params.userId, 'userId');
      const data = await this.findPreferredAnswersByUserUc.execute({ userId });
      return { data };
    });

  upsert = async (
    request: FastifyRequest<{ Params: { userId: string; questionId: string }; Body: unknown }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const userId = requireUuidParam(request.params.userId, 'userId');
      const questionId = requireUuidParam(request.params.questionId, 'questionId');
      const body = validateRequest(preferredAnswerBodySchema, request.body);
      const data = await this.upsertPreferredAnswerUc.execute({ userId, questionId, ...body });
      return { statusCode: existingOrCreated(request), data };
    });
}

const existingOrCreated = (request: FastifyRequest): number =>
  request.method === 'POST' ? 201 : 200;

export const registerPreferredAnswersRoutes = (
  app: FastifyInstance,
  controller: PreferredAnswersController,
): void => {
  app.get('/users/:userId/preferred-answers', controller.findByUser);
  app.put('/users/:userId/preferred-answers/:questionId', controller.upsert);
};
