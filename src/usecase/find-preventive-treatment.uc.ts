import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { FindPreventiveTreatmentInputDto } from '@/dto/find-preventive-treatment-input.dto';
import { PreventiveTreatmentEntryOutputDto } from '@/dto/preventive-treatment-entry-output.dto';
import { requireNonEmpty } from '@/domain/validation';
import { toPreventiveTreatmentEntry } from '@/utils/preventive-treatment-mapper';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindPreventiveTreatmentUc implements UseCaseInterface<
  FindPreventiveTreatmentInputDto,
  PreventiveTreatmentEntryOutputDto | null
> {
  private readonly preventiveTreatmentRepository: PreventiveTreatmentRepository;

  constructor(preventiveTreatmentRepository: PreventiveTreatmentRepository) {
    this.preventiveTreatmentRepository = preventiveTreatmentRepository;
  }

  execute = async (
    input: FindPreventiveTreatmentInputDto,
  ): Promise<PreventiveTreatmentEntryOutputDto | null> => {
    try {
      const id = requireNonEmpty(input.id, 'id');
      const userId = requireNonEmpty(input.userId, 'userId');

      const entity = await this.preventiveTreatmentRepository
        .createQueryBuilder('pt')
        .leftJoinAndSelect('pt.user', 'user')
        .where('pt.id = :id', { id })
        .andWhere('pt.user_id = :userId', { userId })
        .getOne();
      return entity === null ? null : toPreventiveTreatmentEntry(entity);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
