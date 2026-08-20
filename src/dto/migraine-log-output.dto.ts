import { UserResponseOutputDto } from './user-response-output.dto';

export interface MigraineLogOutputDto {
  id: string;
  userId: string;
  sessionId: string | null;
  intensity: number;
  painLocation: string;
  startedAt: Date;
  endedAt: Date | null;
  responses: UserResponseOutputDto[];
}
