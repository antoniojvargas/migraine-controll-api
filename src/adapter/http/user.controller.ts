import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController, resolveRequestUser } from '@/controller/utils';
import { CognitoDeleteUserUc } from '@/usecase/cognito-delete-user.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';

export class UserController {
  constructor(
    private readonly cognitoDeleteUserUc: CognitoDeleteUserUc,
    private readonly userRepository: UserRepository,
  ) {}

  deleteMe = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const user = await resolveRequestUser(request, this.userRepository);
      await this.cognitoDeleteUserUc.execute({ id: user.id });
      return { statusCode: 204 };
    });
}

export const registerUserRoutes = (app: FastifyInstance, controller: UserController): void => {
  app.delete('/users/me', controller.deleteMe);
};
