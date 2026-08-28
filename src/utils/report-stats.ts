import {
  MigraineLogEntity,
  NewUserResponseEntity,
  PreventiveTreatmentScheduleEntity,
} from '@/infra/database/entities';
import {
  DayOfWeekCountOutputDto,
  IntensityBucketOutputDto,
  MonthlyAverageOutputDto,
  TopAnswerOutputDto,
  TopTreatmentOutputDto,
} from '@/dto/report-output.dto';

const REPORT_TOP_LIMIT = 5;
const INTENSITY_BUCKET_SIZE = 10;
const INTENSITY_BUCKET_MAX_START = 90;

export function buildIntensityStats(logs: MigraineLogEntity[]): {
  average: number | null;
  min: number | null;
  max: number | null;
} {
  if (logs.length === 0) {
    return { average: null, min: null, max: null };
  }
  const intensities = logs.map((log) => log.intensity);
  const sum = intensities.reduce((total, intensity) => total + intensity, 0);
  return {
    average: Math.round((sum / logs.length) * 10) / 10,
    min: Math.min(...intensities),
    max: Math.max(...intensities),
  };
}

export function buildDurationStats(logs: MigraineLogEntity[]): { averageMinutes: number | null } {
  const withDuration = logs.filter((log) => log.endedAt !== null);
  if (withDuration.length === 0) {
    return { averageMinutes: null };
  }
  const totalMinutes = withDuration.reduce(
    (total, log) => total + (log.endedAt!.getTime() - log.startedAt.getTime()) / 60000,
    0,
  );
  return { averageMinutes: Math.round((totalMinutes / withDuration.length) * 10) / 10 };
}

export function buildTopAnswers(responses: NewUserResponseEntity[]): TopAnswerOutputDto[] {
  const buckets = new Map<string, TopAnswerOutputDto>();
  for (const response of responses) {
    const selectionId = response.selection?.id ?? null;
    const answerText = response.value ?? response.answerText ?? null;
    const key = selectionId ?? `text:${answerText}`;
    const bucket = buckets.get(key) ?? { selectionId, answerText, count: 0 };
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, REPORT_TOP_LIMIT);
}

export function buildTopTreatments(
  schedules: PreventiveTreatmentScheduleEntity[],
): TopTreatmentOutputDto[] {
  const buckets = new Map<string, TopTreatmentOutputDto>();
  for (const schedule of schedules) {
    const treatmentId = schedule.treatment.id;
    const bucket = buckets.get(treatmentId) ?? {
      treatmentId,
      name: schedule.treatment.name,
      count: 0,
    };
    bucket.count += 1;
    buckets.set(treatmentId, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, REPORT_TOP_LIMIT);
}

export function buildDayOfWeekDistribution(logs: MigraineLogEntity[]): DayOfWeekCountOutputDto[] {
  const counts = new Array<number>(7).fill(0);
  for (const log of logs) {
    counts[log.startedAt.getUTCDay()] += 1;
  }
  return counts.map((count, dayOfWeek) => ({ dayOfWeek, count }));
}

export function buildIntensityDistribution(logs: MigraineLogEntity[]): IntensityBucketOutputDto[] {
  const buckets = new Map<number, number>();
  for (const log of logs) {
    const bucketStart = Math.min(
      Math.floor(log.intensity / INTENSITY_BUCKET_SIZE) * INTENSITY_BUCKET_SIZE,
      INTENSITY_BUCKET_MAX_START,
    );
    buckets.set(bucketStart, (buckets.get(bucketStart) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, count]) => ({
      bucketStart,
      bucketEnd: bucketStart + INTENSITY_BUCKET_SIZE - 1,
      count,
    }));
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function computeMonthKeys(
  from: Date | null,
  to: Date | null,
  dataMonthKeys: string[],
): string[] {
  const sorted = [...dataMonthKeys].sort();
  const startKey = from !== null ? monthKey(from) : sorted[0];
  const endKey = to !== null ? monthKey(to) : sorted[sorted.length - 1];
  if (startKey === undefined || endKey === undefined) {
    return [];
  }
  const [startYear, startMonth] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);
  const months: string[] = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

export function buildMonthlyAverage(
  logs: MigraineLogEntity[],
  from: Date | null,
  to: Date | null,
): MonthlyAverageOutputDto {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const key = monthKey(log.startedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const months = computeMonthKeys(from, to, [...counts.keys()]).map((month) => ({
    month,
    count: counts.get(month) ?? 0,
  }));
  const averagePerMonth =
    months.length > 0 ? Math.round((logs.length / months.length) * 10) / 10 : 0;
  return { averagePerMonth, months };
}
