import { DeepPartial } from 'typeorm';
import { UserEntity } from '@/infra/database/entities';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { User } from '@/domain/user';
import { CreateUserDto } from '@/dto/create-user.dto';
import { UserOutputDto } from '@/dto/user-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class CreateUserUc implements UseCaseInterface<CreateUserDto, UserOutputDto> {
  constructor(private readonly userRepository: UserRepository) {}

  execute = async (input: CreateUserDto): Promise<UserOutputDto> => {
    try {
      const user = User.createNewUser(input);
      const persisted = await this.userRepository.create(this.mapToEntity(user));
      user.assignId(persisted.id);
      return {
        id: persisted.id,
        email: user.email,
        externalId: user.externalId,
        originalEmail: user.originalEmail,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private mapToEntity(user: User): DeepPartial<UserEntity> {
    return {
      email: user.email,
      externalId: user.externalId,
      originalEmail: user.originalEmail,
    };
  }
}
