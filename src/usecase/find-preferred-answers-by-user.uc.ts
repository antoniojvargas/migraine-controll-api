import { PreferredAnswerOutputDto } from '@/dto/preferred-answer.dto';
import { requireNonEmpty } from '@/domain/validation';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindPreferredAnswersByUserUc implements UseCaseInterface<
  { userId: string },
  PreferredAnswerOutputDto[]
> {
  constructor(private readonly preferredAnswersRepository: PreferredAnswersRepository) {}

  execute = async (input: { userId: string }): Promise<PreferredAnswerOutputDto[]> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const entities = await this.preferredAnswersRepository
        .createQueryBuilder('preferredAnswer')
        .leftJoinAndSelect('preferredAnswer.user', 'user')
        .leftJoinAndSelect('preferredAnswer.question', 'question')
        .leftJoinAndSelect('preferredAnswer.selection', 'selection')
        .where('preferredAnswer.user_id = :userId', { userId })
        .getMany();
      return entities.map((entity) => ({
        id: entity.id,
        userId: entity.user.id,
        questionId: entity.question.id,
        selectionId: entity.selection?.id ?? null,
        answerText: entity.answerText,
      }));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
