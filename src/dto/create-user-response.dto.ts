import { Question } from '@/domain/question';

export interface CreateUserResponseDto {
  userId: string;
  question: Question;
  selectionId?: string | null;
  answerText?: string | null;
  migraineLogId?: string | null;
  preventiveTreatmentId?: string | null;
}
