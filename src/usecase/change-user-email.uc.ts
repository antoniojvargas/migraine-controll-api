import { ChangeUserEmailInputDto } from '@/dto/change-user-email-input.dto';
import { UserOutputDto } from '@/dto/user-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserBaseUc } from './user-base.uc';

export class ChangeUserEmailUc
  extends UserBaseUc
  implements UseCaseInterface<ChangeUserEmailInputDto, UserOutputDto>
{
  execute = async (input: ChangeUserEmailInputDto): Promise<UserOutputDto> => {
    try {
      const id = this.validateId(input.id);
      const user = await this.getDomainUser(id);
      user.updateUser({ email: input.email, originalEmail: user.email });
      await this.userRepository.update(
        { id },
        { email: user.email, originalEmail: user.originalEmail, emailChangedAt: new Date() },
      );
      return this.toOutput(user);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
