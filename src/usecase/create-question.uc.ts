import { DeepPartial } from 'typeorm';
import { Question } from '@/domain/question';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { QuestionEntity } from '@/infra/database/entities';
import { CreateQuestionDto } from '@/dto/create-question.dto';
import { QuestionOutputDto } from '@/dto/question-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class CreateQuestionUc implements UseCaseInterface<CreateQuestionDto, QuestionOutputDto> {
  constructor(private readonly questionRepository: QuestionRepository) {}

  execute = async (input: CreateQuestionDto): Promise<QuestionOutputDto> => {
    try {
      const question = Question.createNewQuestion(input);
      const persisted = await this.questionRepository.create(this.mapToEntity(question));
      question.assignId(persisted.id);
      return {
        id: persisted.id,
        key: question.key,
        type: question.type,
        order: question.order,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private mapToEntity(question: Question): DeepPartial<QuestionEntity> {
    return {
      key: question.key,
      type: question.type,
      order: question.order,
    };
  }
}
