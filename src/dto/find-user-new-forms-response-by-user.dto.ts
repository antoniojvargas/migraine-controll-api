export interface FindUserNewFormsResponseByUserInputDto {
  userId: string;
}

export interface NewUserResponseOutputDto {
  id: string;
  userId: string;
  questionId: string;
  selectionId: string | null;
  value: string | null;
  isCustom: boolean;
  answerText: string | null;
  migraineLogId: string | null;
  preventiveTreatmentId: string | null;
}
