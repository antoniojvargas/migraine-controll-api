import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController } from '@/controller/utils';
import { CreateMigraineLogUc } from '@/usecase/create-migraine-log.uc';
import { CreateMigraineLogInputDto } from '@/dto/create-migraine-log-input.dto';

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
      const data = await this.createMigraineLogUc.execute({
        ...request.body,
        userId: request.params.userId,
      });
      return { statusCode: 201, data };
    });
}

export const registerMigraineLogRoutes = (
  app: FastifyInstance,
  controller: MigraineLogController,
): void => {
  app.post('/users/:userId/migraine-logs', controller.create);
};
