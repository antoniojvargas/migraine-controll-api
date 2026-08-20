import { DeepPartial } from 'typeorm';
import { UserEntity } from '@/infra/database/entities';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { User } from '@/domain/user';
import { CreateUserDto } from '@/dto/create-user.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export interface CreateUserOutputDto {
  id: string;
  email: string;
  externalId: string;
}

export class CreateUserUseCase implements UseCaseInterface<CreateUserDto, CreateUserOutputDto> {
  constructor(private readonly userRepository: UserRepository) {}

  execute = async (input: CreateUserDto): Promise<CreateUserOutputDto> => {
    try {
      const user = User.createNewUser(input);
      const persisted = await this.userRepository.create(this.mapToEntity(user));
      user.assignId(persisted.id);
      return { id: persisted.id, email: user.email, externalId: user.externalId };
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
