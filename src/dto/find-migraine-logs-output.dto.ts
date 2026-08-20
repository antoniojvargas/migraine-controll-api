import { MigraineLogEntryOutputDto } from './migraine-log-entry-output.dto';
import { WeeklyStatisticsOutputDto } from './weekly-statistics-output.dto';

export interface FindMigraineLogsOutputDto {
  logs: MigraineLogEntryOutputDto[];
  weeks: WeeklyStatisticsOutputDto[];
}
