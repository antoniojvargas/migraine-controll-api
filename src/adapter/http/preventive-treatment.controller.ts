import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController, validateRequest } from '@/controller/utils';
import { CreatePreventiveTreatmentUc } from '@/usecase/create-preventive-treatment.uc';
import { CreatePreventiveTreatmentInputDto } from '@/dto/create-preventive-treatment-input.dto';
import { uuidParamSchema } from '@/controller/schemas/common.schema';
import { createPreventiveTreatmentBodySchema } from '@/controller/schemas/preventive-treatment.schema';

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
      const { userId } = validateRequest(uuidParamSchema('userId'), request.params);
      const body = validateRequest(createPreventiveTreatmentBodySchema, request.body);
      const data = await this.createPreventiveTreatmentUc.execute({ ...body, userId });
      return { statusCode: 201, data };
    });
}

export const registerPreventiveTreatmentRoutes = (
  app: FastifyInstance,
  controller: PreventiveTreatmentController,
): void => {
  app.post('/users/:userId/preventive-treatments', controller.create);
};
