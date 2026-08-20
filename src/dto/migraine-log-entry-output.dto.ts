export interface MigraineLogEntryOutputDto {
  id: string;
  userId: string;
  sessionId: string | null;
  intensity: number;
  painLocation: string;
  startedAt: Date;
  endedAt: Date | null;
}
