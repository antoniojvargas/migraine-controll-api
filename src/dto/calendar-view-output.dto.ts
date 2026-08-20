import { MigraineLogEntryOutputDto } from './migraine-log-entry-output.dto';

export interface CalendarDayOutputDto {
  day: number;
  logs: MigraineLogEntryOutputDto[];
}

export interface CalendarMonthOutputDto {
  year: number;
  month: number;
  days: CalendarDayOutputDto[];
}

export interface CalendarViewOutputDto {
  userId: string;
  months: CalendarMonthOutputDto[];
}
