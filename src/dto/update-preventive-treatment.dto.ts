export interface UpdatePreventiveTreatmentDto {
  name?: string;
  isRecurrent?: boolean;
  repeatUntil?: string | Date | null;
}
