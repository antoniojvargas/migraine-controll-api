import { Recurrence } from '@/domain/constants';

export interface CreatePreventiveTreatmentScheduleInputDto {
  preventiveTreatmentId: string;
  scheduledAt: string | Date;
  recurrence: Recurrence;
  reminderBeforeLog?: number;
}
