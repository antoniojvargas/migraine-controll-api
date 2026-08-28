import {
  MigraineLogEntity,
  NewUserResponseEntity,
  PreventiveTreatmentScheduleEntity,
} from '@/infra/database/entities';
import {
  buildDayOfWeekDistribution,
  buildDurationStats,
  buildIntensityDistribution,
  buildIntensityStats,
  buildMonthlyAverage,
  buildTopAnswers,
  buildTopTreatments,
  computeMonthKeys,
} from '@/utils/report-stats';

const log = (
  id: string,
  startedAt: string,
  intensity: number,
  endedAt: string | null = null,
): MigraineLogEntity =>
  ({
    id,
    user: { id: 'u-1' },
    intensity,
    startedAt: new Date(startedAt),
    endedAt: endedAt !== null ? new Date(endedAt) : null,
  }) as MigraineLogEntity;

const response = (
  selectionId: string | null,
  answerText: string | null = null,
): NewUserResponseEntity =>
  ({
    selection: selectionId !== null ? { id: selectionId } : null,
    value: null,
    answerText,
  }) as NewUserResponseEntity;

const schedule = (treatmentId: string, name: string): PreventiveTreatmentScheduleEntity =>
  ({
    treatment: { id: treatmentId, name },
  }) as PreventiveTreatmentScheduleEntity;

describe('report-stats helper', () => {
  describe('buildIntensityStats', () => {
    it('returns nulls when there are no logs', () => {
      expect(buildIntensityStats([])).toEqual({ average: null, min: null, max: null });
    });

    it('computes average, min and max intensity', () => {
      expect(
        buildIntensityStats([
          log('l-1', '2026-08-17T08:00:00.000Z', 40),
          log('l-2', '2026-08-18T08:00:00.000Z', 55),
        ]),
      ).toEqual({
        average: 47.5,
        min: 40,
        max: 55,
      });
    });
  });

  describe('buildDurationStats', () => {
    it('returns null average when no log has an end time', () => {
      expect(buildDurationStats([log('l-1', '2026-08-17T08:00:00.000Z', 40)])).toEqual({
        averageMinutes: null,
      });
    });

    it('averages duration in minutes, ignoring logs without an end time', () => {
      const result = buildDurationStats([
        log('l-1', '2026-08-17T08:00:00.000Z', 40, '2026-08-17T09:00:00.000Z'),
        log('l-2', '2026-08-18T08:00:00.000Z', 40, '2026-08-18T09:30:00.000Z'),
        log('l-3', '2026-08-19T08:00:00.000Z', 40),
      ]);
      expect(result.averageMinutes).toBe(75);
    });
  });

  describe('buildTopAnswers', () => {
    it('counts occurrences by selection and sorts descending', () => {
      const top = buildTopAnswers([
        response('sel-light'),
        response('sel-light'),
        response('sel-noise'),
      ]);
      expect(top).toEqual([
        { selectionId: 'sel-light', answerText: null, count: 2 },
        { selectionId: 'sel-noise', answerText: null, count: 1 },
      ]);
    });

    it('groups custom free-text answers by their text when there is no selection', () => {
      const top = buildTopAnswers([
        response(null, 'strong perfume'),
        response(null, 'strong perfume'),
      ]);
      expect(top).toEqual([{ selectionId: null, answerText: 'strong perfume', count: 2 }]);
    });

    it('limits the result to the top 5', () => {
      const responses = Array.from({ length: 6 }, (_, index) =>
        Array.from({ length: 6 - index }, () => response(`sel-${index}`)),
      ).flat();
      const top = buildTopAnswers(responses);
      expect(top).toHaveLength(5);
      expect(top[0]).toEqual({ selectionId: 'sel-0', answerText: null, count: 6 });
    });
  });

  describe('buildTopTreatments', () => {
    it('counts occurrences by treatment and sorts descending', () => {
      const top = buildTopTreatments([
        schedule('t-1', 'Ibuprofen'),
        schedule('t-1', 'Ibuprofen'),
        schedule('t-2', 'Sumatriptan'),
      ]);
      expect(top).toEqual([
        { treatmentId: 't-1', name: 'Ibuprofen', count: 2 },
        { treatmentId: 't-2', name: 'Sumatriptan', count: 1 },
      ]);
    });
  });

  describe('buildDayOfWeekDistribution', () => {
    it('counts logs per UTC day of week, 0 for empty days', () => {
      const distribution = buildDayOfWeekDistribution([
        log('l-1', '2026-08-17T08:00:00.000Z', 40), // Monday
        log('l-2', '2026-08-24T08:00:00.000Z', 40), // Monday
      ]);
      expect(distribution).toHaveLength(7);
      expect(distribution[1]).toEqual({ dayOfWeek: 1, count: 2 });
      expect(distribution[0]).toEqual({ dayOfWeek: 0, count: 0 });
    });
  });

  describe('buildIntensityDistribution', () => {
    it('buckets intensity in ranges of 10, capping the last bucket at 90-99', () => {
      const distribution = buildIntensityDistribution([
        log('l-1', '2026-08-17T08:00:00.000Z', 5),
        log('l-2', '2026-08-18T08:00:00.000Z', 12),
        log('l-3', '2026-08-19T08:00:00.000Z', 100),
      ]);
      expect(distribution).toEqual([
        { bucketStart: 0, bucketEnd: 9, count: 1 },
        { bucketStart: 10, bucketEnd: 19, count: 1 },
        { bucketStart: 90, bucketEnd: 99, count: 1 },
      ]);
    });
  });

  describe('computeMonthKeys', () => {
    it('fills every month in the given range', () => {
      expect(computeMonthKeys(new Date('2026-06-15'), new Date('2026-09-01'), [])).toEqual([
        '2026-06',
        '2026-07',
        '2026-08',
        '2026-09',
      ]);
    });

    it('falls back to the data range when no from/to is given', () => {
      expect(computeMonthKeys(null, null, ['2026-08', '2026-06'])).toEqual([
        '2026-06',
        '2026-07',
        '2026-08',
      ]);
    });
  });

  describe('buildMonthlyAverage', () => {
    it('averages migraine count across every month in range, including empty ones', () => {
      const result = buildMonthlyAverage(
        [log('l-1', '2026-06-10T00:00:00.000Z', 40), log('l-2', '2026-08-10T00:00:00.000Z', 40)],
        new Date('2026-06-01'),
        new Date('2026-08-31'),
      );
      expect(result.months).toEqual([
        { month: '2026-06', count: 1 },
        { month: '2026-07', count: 0 },
        { month: '2026-08', count: 1 },
      ]);
      expect(result.averagePerMonth).toBe(0.7);
    });

    it('returns zero average when there is no data and no range', () => {
      expect(buildMonthlyAverage([], null, null)).toEqual({ averagePerMonth: 0, months: [] });
    });
  });
});
