import { QUESTION_TYPES } from '@/domain/constants';
import { requireNonEmpty, requireOneOf } from '@/domain/validation';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { QuestionEntity } from '@/infra/database/entities';
import { FindQuestionsInputDto } from '@/dto/find-questions-input.dto';
import { QuestionOutputDto } from '@/dto/question-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindQuestionsUc implements UseCaseInterface<
  FindQuestionsInputDto,
  QuestionOutputDto[]
> {
  constructor(private readonly questionRepository: QuestionRepository) {}

  execute = async (input: FindQuestionsInputDto): Promise<QuestionOutputDto[]> => {
    try {
      const query = this.questionRepository.createQueryBuilder('question');
      if (input.type !== undefined) {
        query.andWhere('question.type = :type', {
          type: requireOneOf(input.type, QUESTION_TYPES, 'type'),
        });
      }
      if (input.key !== undefined) {
        query.andWhere('question.key = :key', { key: requireNonEmpty(input.key, 'key') });
      }
      query.orderBy('question.order', 'ASC');
      const entities = await query.getMany();
      return entities.map((entity) => this.toOutput(entity));
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private toOutput(entity: QuestionEntity): QuestionOutputDto {
    return {
      id: entity.id,
      key: entity.key,
      type: entity.type,
      order: entity.order,
    };
  }
}
