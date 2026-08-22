import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController } from '@/controller/utils';
import { CreatePreventiveTreatmentUc } from '@/usecase/create-preventive-treatment.uc';
import { CreatePreventiveTreatmentInputDto } from '@/dto/create-preventive-treatment-input.dto';

export class PreventiveTreatmentController {
  constructor(private readonly createPreventiveTreatmentUc: CreatePreventiveTreatmentUc) {}

  create = async (
    request: FastifyRequest<{
      Params: { userId: string };
      Body: Omit<CreatePreventiveTreatmentInputDto, 'userId'>;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const data = await this.createPreventiveTreatmentUc.execute({
        ...request.body,
        userId: request.params.userId,
      });
      return { statusCode: 201, data };
    });
}

export const registerPreventiveTreatmentRoutes = (
  app: FastifyInstance,
  controller: PreventiveTreatmentController,
): void => {
  app.post('/users/:userId/preventive-treatments', controller.create);
};
