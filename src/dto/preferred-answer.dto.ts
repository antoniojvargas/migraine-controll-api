export interface CreatePreferredAnswerInputDto {
  userId: string;
  questionId: string;
  selectionId?: string;
  answerText?: string;
}

export interface PreferredAnswerOutputDto {
  id: string;
  userId: string;
  questionId: string;
  selectionId: string | null;
  answerText: string | null;
}
