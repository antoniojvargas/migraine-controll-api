export interface FindMigraineLogsInputDto {
  userId: string;
  from?: string | Date | null;
  to?: string | Date | null;
}
