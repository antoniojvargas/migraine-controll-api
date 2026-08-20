import { UpdateUserOriginalEmailInputDto } from '@/dto/update-user-original-email-input.dto';
import { UserOutputDto } from '@/dto/user-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserBaseUc } from './user-base.uc';

export class UpdateUserOriginalEmailUc
  extends UserBaseUc
  implements UseCaseInterface<UpdateUserOriginalEmailInputDto, UserOutputDto>
{
  execute = async (input: UpdateUserOriginalEmailInputDto): Promise<UserOutputDto> => {
    try {
      const id = this.validateId(input.id);
      const user = await this.getDomainUser(id);
      user.updateUser({ originalEmail: input.originalEmail });
      await this.userRepository.update({ id }, { originalEmail: user.originalEmail });
      return this.toOutput(user);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
