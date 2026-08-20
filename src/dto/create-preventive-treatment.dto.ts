export interface CreatePreventiveTreatmentDto {
  userId: string;
  name: string;
  isRecurrent?: boolean;
  repeatUntil?: string | Date | null;
}
