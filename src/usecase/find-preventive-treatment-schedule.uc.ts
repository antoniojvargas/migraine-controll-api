import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { FindPreventiveTreatmentScheduleInputDto } from '@/dto/find-preventive-treatment-schedule-input.dto';
import { PreventiveTreatmentScheduleOutputDto } from '@/dto/preventive-treatment-schedule-output.dto';
import { requireNonEmpty } from '@/domain/validation';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindPreventiveTreatmentScheduleUc implements UseCaseInterface<
  FindPreventiveTreatmentScheduleInputDto,
  PreventiveTreatmentScheduleOutputDto | null
> {
  private readonly scheduleRepository: PreventiveTreatmentScheduleRepository;

  constructor(scheduleRepository: PreventiveTreatmentScheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  execute = async (
    input: FindPreventiveTreatmentScheduleInputDto,
  ): Promise<PreventiveTreatmentScheduleOutputDto | null> => {
    try {
      const id = requireNonEmpty(input.id, 'id');
      const userId = requireNonEmpty(input.userId, 'userId');

      const entity = await this.scheduleRepository
        .createQueryBuilder('pts')
        .innerJoinAndSelect('pts.treatment', 'pt')
        .leftJoinAndSelect('pt.user', 'user')
        .where('pts.id = :id', { id })
        .andWhere('pt.user_id = :userId', { userId })
        .getOne();
      if (entity === null) {
        return null;
      }
      return {
        id: entity.id,
        preventiveTreatmentId: entity.treatment.id,
        scheduledAt: entity.scheduledAt,
        reminderBeforeLog: entity.reminderBeforeLog as number,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
