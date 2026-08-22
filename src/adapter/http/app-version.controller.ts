import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { FindAppVersionUc } from '@/usecase/find-app-version.uc';
import { FindAppVersionInputDto } from '@/dto/find-app-version.dto';
import { executeController, RequestSchema, validateRequest } from '@/controller/utils';

const appVersionQuerySchema: RequestSchema<FindAppVersionInputDto> = {
  validate(data: unknown) {
    const query = (data ?? {}) as Record<string, unknown>;
    const errors: string[] = [];
    if (typeof query.platform !== 'string' || query.platform.trim().length === 0) {
      errors.push('platform is required');
    }
    if (
      typeof query.currentVersion !== 'string' ||
      /^\d+\.\d+\.\d+$/.test(query.currentVersion) === false
    ) {
      errors.push('currentVersion must be a valid semver string');
    }
    if (errors.length > 0) {
      return {
        value: {} as FindAppVersionInputDto,
        error: { message: errors.join('; ') },
      };
    }
    return {
      value: {
        platform: query.platform as string,
        currentVersion: query.currentVersion as string,
      },
    };
  },
};

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
