import { UserResponseOutputDto } from './user-response-output.dto';

export interface RecurrentSymptomOutputDto {
  selectionId: string | null;
  answerText: string | null;
  occurrences: number;
}

export interface MigraineLogOutputDto {
  id: string;
  userId: string;
  sessionId: string | null;
  intensity: number;
  painLocation: string;
  startedAt: Date;
  endedAt: Date | null;
  responses: UserResponseOutputDto[];
  recurrentSymptoms: RecurrentSymptomOutputDto[];
}
