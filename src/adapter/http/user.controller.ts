import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController } from '@/controller/utils';
import { CognitoDeleteUserUc } from '@/usecase/cognito-delete-user.uc';
import { AppError } from '@/utils/app-error';

export class UserController {
  constructor(private readonly cognitoDeleteUserUc: CognitoDeleteUserUc) {}

  deleteMe = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> =>
    executeController(reply, async () => {
      if (request.user === undefined) {
        throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization token');
      }
      await this.cognitoDeleteUserUc.execute({ id: request.user.id });
      return { statusCode: 204 };
    });
}

export const registerUserRoutes = (app: FastifyInstance, controller: UserController): void => {
  app.delete('/users/me', { onRequest: [app.authenticate] }, controller.deleteMe);
};
