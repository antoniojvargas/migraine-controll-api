import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController } from '@/controller/utils';
import { CreateProfileUc } from '@/usecase/create-profile.uc';
import { UpdateProfileUc } from '@/usecase/update-profile.uc';
import { CreateProfileDto } from '@/dto/create-profile.dto';
import { UpdateProfileInputDto } from '@/dto/update-profile-input.dto';

export class ProfileController {
  constructor(
    private readonly createProfileUc: CreateProfileUc,
    private readonly updateProfileUc: UpdateProfileUc,
  ) {}

  create = async (
    request: FastifyRequest<{ Params: { userId: string }; Body: Omit<CreateProfileDto, 'userId'> }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const data = await this.createProfileUc.execute({
        ...request.body,
        userId: request.params.userId,
      });
      return { statusCode: 201, data };
    });

  update = async (
    request: FastifyRequest<{
      Params: { userId: string };
      Body: Omit<UpdateProfileInputDto, 'userId'>;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const data = await this.updateProfileUc.execute({
        ...request.body,
        userId: request.params.userId,
      });
      return { statusCode: 200, data };
    });
}

export const registerProfileRoutes = (
  app: FastifyInstance,
  controller: ProfileController,
): void => {
  app.post('/users/:userId/profiles', controller.create);
  app.patch('/users/:userId/profiles', controller.update);
};
