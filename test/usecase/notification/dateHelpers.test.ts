import {
  calculateAverageMigrainesPerWeek,
  getWeekKey,
  getWeekStart,
} from '@/usecase/notification/dateHelpers';

describe('getWeekStart', () => {
  it('returns the same day (at midnight UTC) when given a Monday', () => {
    const monday = new Date('2026-08-24T15:30:00Z');
    expect(getWeekStart(monday).toISOString()).toBe('2026-08-24T00:00:00.000Z');
  });

  it('returns the preceding Monday when given a mid-week day', () => {
    const wednesday = new Date('2026-08-26T09:00:00Z');
    expect(getWeekStart(wednesday).toISOString()).toBe('2026-08-24T00:00:00.000Z');
  });

  it('returns the preceding Monday when given a Sunday', () => {
    const sunday = new Date('2026-08-30T23:59:59Z');
    expect(getWeekStart(sunday).toISOString()).toBe('2026-08-24T00:00:00.000Z');
  });

  it('returns the preceding Monday when given a Saturday', () => {
    const saturday = new Date('2026-08-29T00:00:00Z');
    expect(getWeekStart(saturday).toISOString()).toBe('2026-08-24T00:00:00.000Z');
  });

  it('truncates time-of-day components to midnight UTC', () => {
    const date = new Date('2026-08-25T23:59:59.999Z');
    expect(getWeekStart(date).toISOString()).toBe('2026-08-24T00:00:00.000Z');
  });

  it('handles a week that crosses a month boundary', () => {
    const date = new Date('2026-09-01T12:00:00Z');
    expect(getWeekStart(date).toISOString()).toBe('2026-08-31T00:00:00.000Z');
  });

  it('handles a week that crosses a year boundary', () => {
    const date = new Date('2026-01-01T12:00:00Z');
    expect(getWeekStart(date).toISOString()).toBe('2025-12-29T00:00:00.000Z');
  });

  it('does not mutate the input date', () => {
    const date = new Date('2026-08-26T09:00:00Z');
    const original = date.toISOString();
    getWeekStart(date);
    expect(date.toISOString()).toBe(original);
  });
});

describe('getWeekKey', () => {
  it('returns the week start formatted as YYYY-MM-DD', () => {
    expect(getWeekKey(new Date('2026-08-26T09:00:00Z'))).toBe('2026-08-24');
  });

  it('returns the same key for two dates in the same week', () => {
    const monday = new Date('2026-08-24T00:00:00Z');
    const sunday = new Date('2026-08-30T23:59:59Z');
    expect(getWeekKey(monday)).toBe(getWeekKey(sunday));
  });

  it('returns different keys for dates in consecutive weeks', () => {
    const sunday = new Date('2026-08-30T23:59:59Z');
    const nextMonday = new Date('2026-08-31T00:00:00Z');
    expect(getWeekKey(sunday)).not.toBe(getWeekKey(nextMonday));
  });

  it('pads single-digit months and days', () => {
    expect(getWeekKey(new Date('2026-01-02T00:00:00Z'))).toBe('2025-12-29');
    expect(getWeekKey(new Date('2026-09-02T00:00:00Z'))).toBe('2026-08-31');
  });
});

describe('calculateAverageMigrainesPerWeek', () => {
  it('returns 0 for an empty list', () => {
    expect(calculateAverageMigrainesPerWeek([])).toBe(0);
  });

  it('returns the count when a single migraine is logged', () => {
    expect(calculateAverageMigrainesPerWeek([new Date('2026-08-26T09:00:00Z')])).toBe(1);
  });

  it('averages multiple migraines logged within the same week', () => {
    const dates = [
      new Date('2026-08-24T08:00:00Z'),
      new Date('2026-08-26T08:00:00Z'),
      new Date('2026-08-30T08:00:00Z'),
    ];
    expect(calculateAverageMigrainesPerWeek(dates)).toBe(3);
  });

  it('divides by the number of weeks spanned when logs cross week boundaries', () => {
    const dates = [
      new Date('2026-08-24T08:00:00Z'),
      new Date('2026-08-31T08:00:00Z'),
      new Date('2026-09-01T08:00:00Z'),
      new Date('2026-09-06T08:00:00Z'),
    ];
    expect(calculateAverageMigrainesPerWeek(dates)).toBe(2);
  });

  it('counts empty weeks within the span towards the denominator', () => {
    const dates = [new Date('2026-08-24T08:00:00Z'), new Date('2026-09-14T08:00:00Z')];
    expect(calculateAverageMigrainesPerWeek(dates)).toBeCloseTo(2 / 4);
  });

  it('is order-independent', () => {
    const ordered = [
      new Date('2026-08-24T08:00:00Z'),
      new Date('2026-08-31T08:00:00Z'),
      new Date('2026-09-07T08:00:00Z'),
    ];
    const shuffled = [ordered[2], ordered[0], ordered[1]];
    expect(calculateAverageMigrainesPerWeek(shuffled)).toBe(
      calculateAverageMigrainesPerWeek(ordered),
    );
  });

  it('treats a full week span (Monday to Sunday) as a single week', () => {
    const dates = [new Date('2026-08-24T00:00:00Z'), new Date('2026-08-30T23:59:59Z')];
    expect(calculateAverageMigrainesPerWeek(dates)).toBe(2);
  });
});
