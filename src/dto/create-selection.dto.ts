import { Question } from '@/domain/question';

export interface CreateSelectionDto {
  question: Question;
  key: string;
  order: number;
}
