import { DomainError } from '@/domain/domain-error';
import { requireNonEmpty } from '@/domain/validation';
import { FindProfileInputDto } from '@/dto/find-profile-input.dto';
import { ProfileOutputDto } from '@/dto/profile-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { ProfileBaseUc } from './profile-base.uc';

export class FindProfileUc
  extends ProfileBaseUc
  implements UseCaseInterface<FindProfileInputDto, ProfileOutputDto | null>
{
  execute = async (input: FindProfileInputDto): Promise<ProfileOutputDto | null> => {
    try {
      const hasId = input.id !== undefined;
      const hasUserId = input.userId !== undefined;
      if (hasId === hasUserId) {
        throw new DomainError('Provide exactly one of id or userId');
      }
      if (input.id !== undefined) {
        return this.findById(this.validateId(input.id));
      }
      return this.findByUserId(requireNonEmpty(input.userId as string, 'userId'));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
