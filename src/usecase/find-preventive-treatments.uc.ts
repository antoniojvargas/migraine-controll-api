import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { FindPreventiveTreatmentsInputDto } from '@/dto/find-preventive-treatments-input.dto';
import { PreventiveTreatmentEntryOutputDto } from '@/dto/preventive-treatment-entry-output.dto';
import { requireNonEmpty } from '@/domain/validation';
import { toPreventiveTreatmentEntry } from '@/utils/preventive-treatment-mapper';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindPreventiveTreatmentsUc implements UseCaseInterface<
  FindPreventiveTreatmentsInputDto,
  PreventiveTreatmentEntryOutputDto[]
> {
  private readonly preventiveTreatmentRepository: PreventiveTreatmentRepository;

  constructor(preventiveTreatmentRepository: PreventiveTreatmentRepository) {
    this.preventiveTreatmentRepository = preventiveTreatmentRepository;
  }

  execute = async (
    input: FindPreventiveTreatmentsInputDto,
  ): Promise<PreventiveTreatmentEntryOutputDto[]> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const entities = await this.preventiveTreatmentRepository
        .createQueryBuilder('pt')
        .leftJoinAndSelect('pt.user', 'user')
        .where('pt.user_id = :userId', { userId })
        .orderBy('pt.name', 'ASC')
        .getMany();
      return entities.map((entity) => toPreventiveTreatmentEntry(entity));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
