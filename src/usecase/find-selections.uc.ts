import { requireNonEmpty } from '@/domain/validation';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { SelectionEntity } from '@/infra/database/entities';
import { FindSelectionsInputDto } from '@/dto/find-selections-input.dto';
import { SelectionOutputDto } from '@/dto/selection-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindSelectionsUc implements UseCaseInterface<
  FindSelectionsInputDto,
  SelectionOutputDto[]
> {
  constructor(private readonly selectionRepository: SelectionRepository) {}

  execute = async (input: FindSelectionsInputDto): Promise<SelectionOutputDto[]> => {
    try {
      const questionId = requireNonEmpty(input.questionId, 'questionId');
      const entities = await this.selectionRepository
        .createQueryBuilder('selection')
        .leftJoinAndSelect('selection.question', 'question')
        .where('selection.question_id = :questionId', { questionId })
        .orderBy('selection.order', 'ASC')
        .getMany();
      return entities.map((entity) => this.toOutput(entity));
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private toOutput(entity: SelectionEntity): SelectionOutputDto {
    return {
      id: entity.id,
      key: entity.key,
      order: entity.order,
      questionId: entity.question.id,
    };
  }
}
