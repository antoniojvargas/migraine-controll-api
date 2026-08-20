import { PreventiveTreatmentEntity } from '@/infra/database/entities';
import { PreventiveTreatmentEntryOutputDto } from '@/dto/preventive-treatment-entry-output.dto';

export function toPreventiveTreatmentEntry(
  treatment: PreventiveTreatmentEntity,
): PreventiveTreatmentEntryOutputDto {
  return {
    id: treatment.id,
    userId: treatment.user.id,
    name: treatment.name,
    isRecurrent: treatment.isRecurrent,
    repeatUntil: treatment.repeatUntil,
  };
}
