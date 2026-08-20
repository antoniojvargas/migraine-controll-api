export interface CreateMigraineLogDto {
  userId: string;
  sessionId?: string | null;
  intensity: number;
  painLocation: string;
  startedAt: string | Date;
  endedAt?: string | Date | null;
}
