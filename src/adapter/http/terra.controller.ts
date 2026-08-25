import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController } from '@/controller/utils';
import { ProcessTerraWebhookUc } from '@/usecase/terra/process-terra-webhook.uc';
import { TerraWebhookPayloadDto } from '@/dto/terra-webhook-payload.dto';

export class TerraController {
  constructor(private readonly processTerraWebhookUc: ProcessTerraWebhookUc) {}

  webhook = async (
    request: FastifyRequest<{ Body: TerraWebhookPayloadDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const data = await this.processTerraWebhookUc.execute(request.body);
      return { data };
    });
}

export const registerTerraRoutes = (app: FastifyInstance, controller: TerraController): void => {
  app.post('/terra/webhook', controller.webhook);
};
