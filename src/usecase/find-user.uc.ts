import { DomainError } from '@/domain/domain-error';
import { requireNonEmpty } from '@/domain/validation';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { FindUserInputDto } from '@/dto/find-user-input.dto';
import { UserOutputDto } from '@/dto/user-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindUserUc implements UseCaseInterface<FindUserInputDto, UserOutputDto | null> {
  constructor(private readonly userRepository: UserRepository) {}

  execute = async (input: FindUserInputDto): Promise<UserOutputDto | null> => {
    try {
      const hasId = input.id !== undefined;
      const hasExternalId = input.externalId !== undefined;
      if (hasId === hasExternalId) {
        throw new DomainError('Provide exactly one of id or externalId');
      }
      const criteria =
        input.id !== undefined
          ? { id: requireNonEmpty(input.id, 'id') }
          : { externalId: requireNonEmpty(input.externalId as string, 'externalId') };
      const entity = await this.userRepository.findOneBy(criteria);
      if (entity === null) {
        return null;
      }
      return {
        id: entity.id,
        email: entity.email,
        externalId: entity.externalId,
        originalEmail: entity.originalEmail,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
