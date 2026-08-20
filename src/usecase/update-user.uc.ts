import { DomainError } from '@/domain/domain-error';
import { UpdateUserInputDto } from '@/dto/update-user-input.dto';
import { UserOutputDto } from '@/dto/user-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserBaseUc } from './user-base.uc';

export class UpdateUserUc
  extends UserBaseUc
  implements UseCaseInterface<UpdateUserInputDto, UserOutputDto>
{
  execute = async (input: UpdateUserInputDto): Promise<UserOutputDto> => {
    try {
      const id = this.validateId(input.id);
      if (input.email === undefined && input.originalEmail === undefined) {
        throw new DomainError('nothing to update');
      }
      const user = await this.getDomainUser(id);
      user.updateUser({ email: input.email, originalEmail: input.originalEmail });
      await this.userRepository.update(
        { id },
        { email: user.email, originalEmail: user.originalEmail },
      );
      return this.toOutput(user);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
