import { requireNonEmpty } from '@/domain/validation';
import { CreateUserResponsesInputDto } from '@/dto/create-user-responses-input.dto';
import { UserResponseOutputDto } from '@/dto/user-response-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserResponseBaseUc } from './user-response-base.uc';

export class CreateUserResponsesUc
  extends UserResponseBaseUc
  implements UseCaseInterface<CreateUserResponsesInputDto, UserResponseOutputDto[]>
{
  execute = async (input: CreateUserResponsesInputDto): Promise<UserResponseOutputDto[]> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const responses = await this.persistUserResponses({
        userId,
        items: input.responses,
        migraineLogId: input.migraineLogId,
        preventiveTreatmentId: input.preventiveTreatmentId,
      });
      return responses.map((response) => this.toOutput(response));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
