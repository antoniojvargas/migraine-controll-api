import { User } from '@/domain/user';
import { requireNonEmpty } from '@/domain/validation';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { UserOutputDto } from '@/dto/user-output.dto';
import { AppError } from '@/utils/app-error';

export abstract class UserBaseUc {
  constructor(protected readonly userRepository: UserRepository) {}

  protected async getDomainUser(id: string): Promise<User> {
    const entity = await this.userRepository.findOneBy({ id });
    if (entity === null) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    const user = User.createNewUser({ email: entity.email, externalId: entity.externalId });
    user.assignId(entity.id);
    user.updateUser({ originalEmail: entity.originalEmail });
    return user;
  }

  protected toOutput(user: User): UserOutputDto {
    return {
      id: user.id as string,
      email: user.email,
      externalId: user.externalId,
      originalEmail: user.originalEmail,
    };
  }

  protected validateId(id: string | undefined): string {
    return requireNonEmpty(id as string, 'id');
  }
}
