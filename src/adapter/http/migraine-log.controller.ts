import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController, validateRequest } from '@/controller/utils';
import { CreateMigraineLogUc } from '@/usecase/create-migraine-log.uc';
import { CreateMigraineLogInputDto } from '@/dto/create-migraine-log-input.dto';
import { uuidParamSchema } from '@/controller/schemas/common.schema';
import { createMigraineLogBodySchema } from '@/controller/schemas/migraine-log.schema';

export class MigraineLogController {
  constructor(private readonly createMigraineLogUc: CreateMigraineLogUc) {}

  create = async (
    request: FastifyRequest<{
      Params: { userId: string };
      Body: Omit<CreateMigraineLogInputDto, 'userId'>;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const { userId } = validateRequest(uuidParamSchema('userId'), request.params);
      const body = validateRequest(createMigraineLogBodySchema, request.body);
      const data = await this.createMigraineLogUc.execute({ ...body, userId });
      return { statusCode: 201, data };
    });
}

export const registerMigraineLogRoutes = (
  app: FastifyInstance,
  controller: MigraineLogController,
): void => {
  app.post('/users/:userId/migraine-logs', controller.create);
};
