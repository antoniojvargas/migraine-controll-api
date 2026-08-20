import { requireNonEmpty } from '@/domain/validation';
import { CreateUserResponseInputDto } from '@/dto/create-user-response-input.dto';
import { UserResponseOutputDto } from '@/dto/user-response-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserResponseBaseUc } from './user-response-base.uc';

export class CreateUserResponseUc
  extends UserResponseBaseUc
  implements UseCaseInterface<CreateUserResponseInputDto, UserResponseOutputDto>
{
  execute = async (input: CreateUserResponseInputDto): Promise<UserResponseOutputDto> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const question = await this.loadQuestion(input.questionId);
      const resolved = await this.resolveAnswer(
        question,
        input.answerId,
        input.answerText,
        input.answerLanguageCode,
      );
      const response = this.buildUserResponse(
        userId,
        question,
        resolved,
        input.migraineLogId,
        input.preventiveTreatmentId,
      );
      const persisted = await this.userResponseRepository.create(
        this.mapUserResponseToEntity(response),
      );
      response.assignId(persisted.id);
      return this.toOutput(response);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
