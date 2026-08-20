export interface FindCalendarViewInputDto {
  userId: string;
  from?: string | Date | null;
  to?: string | Date | null;
  timezone?: string;
}
