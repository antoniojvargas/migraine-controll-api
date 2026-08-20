export interface PreventiveTreatmentEntryOutputDto {
  id: string;
  userId: string;
  name: string;
  isRecurrent: boolean;
  repeatUntil: Date | null;
}
