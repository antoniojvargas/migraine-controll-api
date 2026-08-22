import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController } from '@/controller/utils';
import { FindAcuteTreatmentWorseFeedbackOptionsUc } from '@/usecase/find-acute-treatment-worse-feedback-options.uc';

export class AcuteTreatmentFeedbackController {
  constructor(private readonly findFeedbackOptionsUc: FindAcuteTreatmentWorseFeedbackOptionsUc) {}

  list = async (_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const data = await this.findFeedbackOptionsUc.execute();
      return { data };
    });
}

export const registerAcuteTreatmentFeedbackRoutes = (
  app: FastifyInstance,
  controller: AcuteTreatmentFeedbackController,
): void => {
  app.get('/acute-treatment-worse-feedback-options', controller.list);
};
