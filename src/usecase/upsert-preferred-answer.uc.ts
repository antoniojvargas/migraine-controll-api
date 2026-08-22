import { DeepPartial } from 'typeorm';
import {
  PreferredAnswerOutputDto,
  CreatePreferredAnswerInputDto,
} from '@/dto/preferred-answer.dto';
import { PreferredAnswersEntity } from '@/infra/database/entities';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class UpsertPreferredAnswerUc implements UseCaseInterface<
  CreatePreferredAnswerInputDto,
  PreferredAnswerOutputDto
> {
  constructor(private readonly preferredAnswersRepository: PreferredAnswersRepository) {}

  execute = async (input: CreatePreferredAnswerInputDto): Promise<PreferredAnswerOutputDto> => {
    try {
      const existing = await this.loadByUserAndQuestion(input.userId, input.questionId);
      const payload: DeepPartial<PreferredAnswersEntity> = {
        user: { id: input.userId },
        question: { id: input.questionId },
        selection: input.selectionId !== undefined ? { id: input.selectionId } : null,
        answerText: input.answerText ?? null,
      };
      if (existing === null) {
        const created = await this.preferredAnswersRepository.create(payload);
        return this.toOutput(created);
      }
      await this.preferredAnswersRepository.update({ id: existing.id }, payload);
      return {
        id: existing.id,
        userId: input.userId,
        questionId: input.questionId,
        selectionId: input.selectionId ?? null,
        answerText: input.answerText ?? null,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private async loadByUserAndQuestion(
    userId: string,
    questionId: string,
  ): Promise<PreferredAnswersEntity | null> {
    return this.preferredAnswersRepository
      .createQueryBuilder('preferredAnswer')
      .leftJoinAndSelect('preferredAnswer.user', 'user')
      .leftJoinAndSelect('preferredAnswer.question', 'question')
      .leftJoinAndSelect('preferredAnswer.selection', 'selection')
      .where('preferredAnswer.user_id = :userId', { userId })
      .andWhere('preferredAnswer.question_id = :questionId', { questionId })
      .getOne();
  }

  private toOutput(entity: PreferredAnswersEntity): PreferredAnswerOutputDto {
    return {
      id: entity.id,
      userId: entity.user.id,
      questionId: entity.question.id,
      selectionId: entity.selection?.id ?? null,
      answerText: entity.answerText,
    };
  }
}
