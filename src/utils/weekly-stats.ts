import { MigraineLogEntity, PreventiveTreatmentScheduleEntity } from '@/infra/database/entities';
import { WeeklyStatisticsOutputDto } from '@/dto/weekly-statistics-output.dto';

export function sundayOf(date: Date): Date {
  const sunday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
  return sunday;
}

export function computeWeekStarts(
  from: Date | null,
  to: Date | null,
  dataWeekStarts: Date[],
): Date[] {
  const sorted = [...dataWeekStarts].sort((a, b) => a.getTime() - b.getTime());
  const start = from !== null ? sundayOf(from) : sorted[0];
  const end = to !== null ? sundayOf(to) : sorted[sorted.length - 1];
  if (start === undefined || end === undefined) {
    return [];
  }
  const weeks: Date[] = [];
  for (
    let current = new Date(start);
    current.getTime() <= end.getTime();
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 7),
    )
  ) {
    weeks.push(current);
  }
  return weeks;
}

export function buildWeeklyStatistics(
  logs: MigraineLogEntity[],
  schedules: PreventiveTreatmentScheduleEntity[],
  from: Date | null,
  to: Date | null,
): WeeklyStatisticsOutputDto[] {
  const buckets = new Map<
    string,
    { migraineCount: number; intensitySum: number; treatmentCount: number }
  >();
  for (const log of logs) {
    const key = sundayOf(log.startedAt).toISOString();
    const bucket = buckets.get(key) ?? { migraineCount: 0, intensitySum: 0, treatmentCount: 0 };
    bucket.migraineCount += 1;
    bucket.intensitySum += log.intensity;
    buckets.set(key, bucket);
  }
  for (const schedule of schedules) {
    const key = sundayOf(schedule.scheduledAt).toISOString();
    const bucket = buckets.get(key) ?? { migraineCount: 0, intensitySum: 0, treatmentCount: 0 };
    bucket.treatmentCount += 1;
    buckets.set(key, bucket);
  }

  const dataWeekStarts = [...buckets.keys()].map((key) => new Date(key));
  return computeWeekStarts(from, to, dataWeekStarts).map((weekStart) => {
    const bucket = buckets.get(weekStart.toISOString()) ?? {
      migraineCount: 0,
      intensitySum: 0,
      treatmentCount: 0,
    };
    return {
      weekStart: weekStart.toISOString().slice(0, 10),
      migraineCount: bucket.migraineCount,
      averageIntensity:
        bucket.migraineCount > 0
          ? Math.round((bucket.intensitySum / bucket.migraineCount) * 10) / 10
          : null,
      treatmentCount: bucket.treatmentCount,
    };
  });
}
