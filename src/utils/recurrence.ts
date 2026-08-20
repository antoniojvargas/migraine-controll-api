import { Recurrence } from '@/domain/constants';

export interface RecurrenceWindow {
  start: Date;
  recurrence: Recurrence;
  end: Date;
}

export function addRecurrence(date: Date, recurrence: Recurrence): Date {
  const next = new Date(date);
  switch (recurrence) {
    case 'Day':
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case 'Week':
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case 'Month':
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case 'Year':
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }
  return next;
}

export function generateRecurrenceDates({ start, recurrence, end }: RecurrenceWindow): Date[] {
  const dates: Date[] = [];
  let current = new Date(start);
  while (current.getTime() <= end.getTime()) {
    dates.push(current);
    current = addRecurrence(current, recurrence);
  }
  return dates;
}
