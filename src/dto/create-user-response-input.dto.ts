export interface CreateUserResponseInputDto {
  userId: string;
  questionId: string;
  answerId?: string | null;
  answerText?: string | null;
  answerLanguageCode?: string;
  migraineLogId?: string | null;
  preventiveTreatmentId?: string | null;
}
