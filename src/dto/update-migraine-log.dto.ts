export interface UpdateMigraineLogDto {
  sessionId?: string | null;
  intensity?: number;
  painLocation?: string;
  endedAt?: string | Date | null;
}
