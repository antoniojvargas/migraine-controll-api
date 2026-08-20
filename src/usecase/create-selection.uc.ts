import { DeepPartial } from 'typeorm';
import { Selection } from '@/domain/selection';
import { Question } from '@/domain/question';
import { requireNonEmpty } from '@/domain/validation';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionEntity } from '@/infra/database/entities';
import { CreateSelectionInputDto } from '@/dto/create-selection-input.dto';
import { SelectionOutputDto } from '@/dto/selection-output.dto';
import { AppError } from '@/utils/app-error';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class CreateSelectionUc implements UseCaseInterface<
  CreateSelectionInputDto,
  SelectionOutputDto
> {
  constructor(
    private readonly selectionRepository: SelectionRepository,
    private readonly questionRepository: QuestionRepository,
  ) {}

  execute = async (input: CreateSelectionInputDto): Promise<SelectionOutputDto> => {
    try {
      const questionId = requireNonEmpty(input.questionId, 'questionId');
      const questionEntity = await this.questionRepository.findOneBy({ id: questionId });
      if (questionEntity === null) {
        throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
      }
      const question = Question.createNewQuestion({
        key: questionEntity.key,
        type: questionEntity.type,
        order: questionEntity.order,
      });
      question.assignId(questionEntity.id);
      const selection = Selection.createNewSelection({
        question,
        key: input.key,
        order: input.order,
      });
      const persisted = await this.selectionRepository.create(this.mapToEntity(selection));
      selection.assignId(persisted.id);
      return {
        id: persisted.id,
        key: selection.key,
        order: selection.order,
        questionId: selection.questionId,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private mapToEntity(selection: Selection): DeepPartial<SelectionEntity> {
    return {
      question: { id: selection.questionId },
      key: selection.key,
      order: selection.order,
    };
  }
}
