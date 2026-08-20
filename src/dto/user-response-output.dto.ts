export interface UserResponseOutputDto {
  id: string;
  userId: string;
  questionId: string;
  selectionId: string | null;
  answerText: string | null;
  migraineLogId: string | null;
  preventiveTreatmentId: string | null;
}
