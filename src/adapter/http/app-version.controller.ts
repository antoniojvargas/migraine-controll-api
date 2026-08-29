import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { FindAppVersionUc } from '@/usecase/find-app-version.uc';
import { FindAppVersionInputDto } from '@/dto/find-app-version.dto';
import { executeController, validateRequest } from '@/controller/utils';
import { appVersionQuerySchema } from '@/controller/schemas/app-version.schema';

export class AppVersionController {
  constructor(private readonly findAppVersionUc: FindAppVersionUc) {}

  findAppVersion = async (
    request: FastifyRequest<{ Querystring: FindAppVersionInputDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const input = validateRequest(appVersionQuerySchema, request.query);
      const data = await this.findAppVersionUc.execute(input);
      return { data };
    });
}

export const registerAppVersionRoutes = (
  app: FastifyInstance,
  controller: AppVersionController,
): void => {
  app.get('/app-version', controller.findAppVersion);
};
