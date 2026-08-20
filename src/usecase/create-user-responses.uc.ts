import { DeepPartial } from 'typeorm';
import { UserResponse } from '@/domain/user-response';
import { Question } from '@/domain/question';
import { requireNonEmpty } from '@/domain/validation';
import { UserResponseEntity } from '@/infra/database/entities';
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
      const questionCache = new Map<string, Question>();
      const responses: UserResponse[] = [];
      const entities: DeepPartial<UserResponseEntity>[] = [];
      for (const item of input.responses) {
        const question = await this.loadQuestion(item.questionId, questionCache);
        const resolved = await this.resolveAnswer(
          question,
          item.answerId,
          item.answerText,
          item.answerLanguageCode,
        );
        const response = this.buildUserResponse(
          userId,
          question,
          resolved,
          input.migraineLogId,
          input.preventiveTreatmentId,
        );
        responses.push(response);
        entities.push(this.mapUserResponseToEntity(response));
      }
      const persisted = await this.userResponseRepository.bulkCreate(entities);
      responses.forEach((response, index) => response.assignId(persisted[index].id));
      return responses.map((response) => this.toOutput(response));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
