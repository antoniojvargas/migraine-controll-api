import { DeepPartial } from 'typeorm';
import { DEFAULT_RECURRENCE_HORIZON_DAYS, RECURRENCE_TYPES, Recurrence } from '@/domain/constants';
import { DomainError } from '@/domain/domain-error';
import { requireNonEmpty, requireNonNegativeInt, requireOneOf } from '@/domain/validation';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { PreventiveTreatmentScheduleEntity } from '@/infra/database/entities';
import { CreatePreventiveTreatmentScheduleInputDto } from '@/dto/create-preventive-treatment-schedule-input.dto';
import { PreventiveTreatmentScheduleOutputDto } from '@/dto/preventive-treatment-schedule-output.dto';
import { generateRecurrenceDates } from '@/utils/recurrence';
import { AppError } from '@/utils/app-error';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class CreatePreventiveTreatmentScheduleUc implements UseCaseInterface<
  CreatePreventiveTreatmentScheduleInputDto,
  PreventiveTreatmentScheduleOutputDto[]
> {
  private readonly preventiveTreatmentRepository: PreventiveTreatmentRepository;
  private readonly scheduleRepository: PreventiveTreatmentScheduleRepository;

  constructor(
    preventiveTreatmentRepository: PreventiveTreatmentRepository,
    scheduleRepository: PreventiveTreatmentScheduleRepository,
  ) {
    this.preventiveTreatmentRepository = preventiveTreatmentRepository;
    this.scheduleRepository = scheduleRepository;
  }

  execute = async (
    input: CreatePreventiveTreatmentScheduleInputDto,
  ): Promise<PreventiveTreatmentScheduleOutputDto[]> => {
    try {
      const id = requireNonEmpty(input.preventiveTreatmentId, 'preventiveTreatmentId');
      const recurrence = requireOneOf(
        input.recurrence,
        RECURRENCE_TYPES,
        'recurrence',
      ) as Recurrence;
      const reminderBeforeLog = requireNonNegativeInt(
        input.reminderBeforeLog ?? 0,
        'reminderBeforeLog',
      );
      const scheduledAt = new Date(input.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new DomainError('scheduledAt has an invalid date format');
      }

      const entity = await this.preventiveTreatmentRepository.findOneBy({ id });
      if (entity === null) {
        throw new AppError(404, 'PREVENTIVE_TREATMENT_NOT_FOUND', 'Preventive treatment not found');
      }

      const dates = entity.isRecurrent
        ? generateRecurrenceDates({
            start: scheduledAt,
            recurrence,
            end: this.computeRecurrenceEnd(entity.repeatUntil, scheduledAt),
          })
        : [scheduledAt];
      const persisted = await this.scheduleRepository.bulkCreate(
        dates.map((date) => this.mapScheduleToEntity(id, date, reminderBeforeLog)),
      );

      return persisted.map((schedule) => ({
        id: schedule.id,
        preventiveTreatmentId: id,
        scheduledAt: schedule.scheduledAt,
        reminderBeforeLog: schedule.reminderBeforeLog as number,
      }));
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private computeRecurrenceEnd(repeatUntil: Date | null, scheduledAt: Date): Date {
    if (repeatUntil !== null) {
      const end = new Date(repeatUntil);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return new Date(scheduledAt.getTime() + DEFAULT_RECURRENCE_HORIZON_DAYS * 24 * 60 * 60 * 1000);
  }

  private mapScheduleToEntity(
    treatmentId: string,
    scheduledAt: Date,
    reminderBeforeLog: number,
  ): DeepPartial<PreventiveTreatmentScheduleEntity> {
    return {
      treatment: { id: treatmentId },
      scheduledAt,
      reminderBeforeLog,
    };
  }
}
