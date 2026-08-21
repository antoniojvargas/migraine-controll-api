import { requireNonEmpty } from '@/domain/validation';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';
import {
  FindUserNewFormsResponseByUserInputDto,
  NewUserResponseOutputDto,
} from '@/dto/find-user-new-forms-response-by-user.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindUserNewFormsResponseByUserUc implements UseCaseInterface<
  FindUserNewFormsResponseByUserInputDto,
  NewUserResponseOutputDto[]
> {
  constructor(private readonly userResponseRepository: NewUserResponseRepository) {}

  execute = async (
    input: FindUserNewFormsResponseByUserInputDto,
  ): Promise<NewUserResponseOutputDto[]> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const entities = await this.userResponseRepository
        .createQueryBuilder('user_response')
        .leftJoinAndSelect('user_response.question', 'question')
        .leftJoinAndSelect('user_response.selection', 'selection')
        .leftJoinAndSelect('user_response.migraineLog', 'migraine_log')
        .leftJoinAndSelect('user_response.preventiveTreatment', 'preventive_treatment')
        .leftJoinAndSelect('user_response.user', 'user')
        .where('user_response.user_id = :userId', { userId })
        .orderBy('question.order', 'ASC')
        .getMany();

      return entities.map((entity) => ({
        id: entity.id,
        userId: entity.user.id,
        questionId: entity.question.id,
        selectionId: entity.selection?.id ?? null,
        value: entity.value ?? null,
        isCustom: entity.isCustom ?? false,
        answerText: entity.answerText ?? null,
        migraineLogId: entity.migraineLog?.id ?? null,
        preventiveTreatmentId: entity.preventiveTreatment?.id ?? null,
      }));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
