import { MigraineLogEntity } from '@/infra/database/entities';
import { MigraineLogEntryOutputDto } from '@/dto/migraine-log-entry-output.dto';
import { DomainError } from '@/domain/domain-error';
import { toMigraineLogEntry } from './migraine-log-mapper';

export interface CalendarMonthGroup {
  year: number;
  month: number;
  days: CalendarDayGroup[];
}

export interface CalendarDayGroup {
  day: number;
  logs: MigraineLogEntryOutputDto[];
}

export function groupLogsByLocalDate(
  logs: MigraineLogEntity[],
  timezone: string,
): CalendarMonthGroup[] {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    throw new DomainError('timezone must be a valid IANA timezone');
  }

  const months = new Map<string, Map<number, MigraineLogEntryOutputDto[]>>();
  const monthOrder: string[] = [];
  for (const log of logs) {
    const parts = formatter.formatToParts(log.startedAt);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);
    const key = `${year}-${month}`;
    let days = months.get(key);
    if (days === undefined) {
      days = new Map();
      months.set(key, days);
      monthOrder.push(key);
    }
    const dayLogs = days.get(day) ?? [];
    dayLogs.push(toMigraineLogEntry(log));
    days.set(day, dayLogs);
  }

  return monthOrder.map((key) => {
    const [year, month] = key.split('-').map(Number);
    const days = months.get(key) as Map<number, MigraineLogEntryOutputDto[]>;
    const dayGroups = [...days.entries()]
      .sort(([dayA], [dayB]) => dayA - dayB)
      .map(([day, logs]) => ({ day, logs }));
    return { year, month, days: dayGroups };
  });
}
