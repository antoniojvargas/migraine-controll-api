import { MigraineLogEntity, PreventiveTreatmentScheduleEntity } from '@/infra/database/entities';
import { buildWeeklyStatistics, computeWeekStarts, sundayOf } from '@/utils/weekly-stats';

const log = (id: string, startedAt: string, intensity: number): MigraineLogEntity =>
  ({
    id,
    user: { id: 'u-1' },
    startedAt: new Date(startedAt),
    intensity,
  }) as MigraineLogEntity;

const schedule = (id: string, scheduledAt: string): PreventiveTreatmentScheduleEntity =>
  ({ id, scheduledAt: new Date(scheduledAt) }) as PreventiveTreatmentScheduleEntity;

describe('weekly-stats helper', () => {
  it('returns the sunday of the week in UTC', () => {
    expect(sundayOf(new Date('2026-08-20T10:00:00.000Z')).toISOString()).toBe(
      '2026-08-16T00:00:00.000Z',
    );
    expect(sundayOf(new Date('2026-08-16T10:00:00.000Z')).toISOString()).toBe(
      '2026-08-16T00:00:00.000Z',
    );
  });

  it('computes contiguous week starts for a full range including empty weeks', () => {
    const weeks = computeWeekStarts(
      new Date('2026-08-12T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z'),
      [],
    );
    expect(weeks.map((w) => w.toISOString().slice(0, 10))).toEqual([
      '2026-08-09',
      '2026-08-16',
      '2026-08-23',
      '2026-08-30',
    ]);
  });

  it('aggregates migraines and treatments per week', () => {
    const weeks = buildWeeklyStatistics(
      [
        log('l-1', '2026-08-17T08:00:00.000Z', 40),
        log('l-2', '2026-08-19T08:00:00.000Z', 60),
        log('l-3', '2026-08-25T08:00:00.000Z', 80),
      ],
      [schedule('s-1', '2026-08-18T08:00:00.000Z'), schedule('s-2', '2026-08-24T08:00:00.000Z')],
      new Date('2026-08-12T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z'),
    );

    expect(weeks).toEqual([
      { weekStart: '2026-08-09', migraineCount: 0, averageIntensity: null, treatmentCount: 0 },
      { weekStart: '2026-08-16', migraineCount: 2, averageIntensity: 50, treatmentCount: 1 },
      { weekStart: '2026-08-23', migraineCount: 1, averageIntensity: 80, treatmentCount: 1 },
      { weekStart: '2026-08-30', migraineCount: 0, averageIntensity: null, treatmentCount: 0 },
    ]);
  });

  it('rounds average intensity to one decimal', () => {
    const weeks = buildWeeklyStatistics(
      [log('l-1', '2026-08-17T08:00:00.000Z', 40), log('l-2', '2026-08-18T08:00:00.000Z', 55)],
      [],
      null,
      null,
    );
    expect(weeks[0].averageIntensity).toBe(47.5);
  });

  it('uses data weeks when no range is given', () => {
    const weeks = buildWeeklyStatistics(
      [log('l-1', '2026-08-17T08:00:00.000Z', 40)],
      [schedule('s-1', '2026-08-23T08:00:00.000Z')],
      null,
      null,
    );
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-08-16', '2026-08-23']);
  });
});
