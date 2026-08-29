import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController, validateRequest } from '@/controller/utils';
import { UpsertPreferredAnswerUc } from '@/usecase/upsert-preferred-answer.uc';
import { FindPreferredAnswersByUserUc } from '@/usecase/find-preferred-answers-by-user.uc';
import { uuidParamSchema, uuidParamsSchema } from '@/controller/schemas/common.schema';
import { preferredAnswerBodySchema } from '@/controller/schemas/preferred-answers.schema';

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
      const { userId } = validateRequest(uuidParamSchema('userId'), request.params);
      const data = await this.findPreferredAnswersByUserUc.execute({ userId });
      return { data };
    });

  upsert = async (
    request: FastifyRequest<{ Params: { userId: string; questionId: string }; Body: unknown }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const { userId, questionId } = validateRequest(
        uuidParamsSchema(['userId', 'questionId']),
        request.params,
      );
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
  app.get<{ Params: { userId: string } }>(
    '/users/:userId/preferred-answers',
    { onRequest: [app.authenticateOwner] },
    controller.findByUser,
  );
  app.put<{ Params: { userId: string; questionId: string }; Body: unknown }>(
    '/users/:userId/preferred-answers/:questionId',
    { onRequest: [app.authenticateOwner] },
    controller.upsert,
  );
};
