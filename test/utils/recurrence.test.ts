import { addRecurrence, generateRecurrenceDates } from '@/utils/recurrence';

describe('recurrence helper', () => {
  it('advances a date by day', () => {
    const date = new Date('2026-01-01T08:00:00.000Z');
    expect(addRecurrence(date, 'Day').toISOString()).toBe('2026-01-02T08:00:00.000Z');
  });

  it('advances a date by week', () => {
    const date = new Date('2026-01-01T08:00:00.000Z');
    expect(addRecurrence(date, 'Week').toISOString()).toBe('2026-01-08T08:00:00.000Z');
  });

  it('advances a date by month', () => {
    const date = new Date('2026-01-01T08:00:00.000Z');
    expect(addRecurrence(date, 'Month').toISOString()).toBe('2026-02-01T08:00:00.000Z');
  });

  it('advances a date by year', () => {
    const date = new Date('2026-01-01T08:00:00.000Z');
    expect(addRecurrence(date, 'Year').toISOString()).toBe('2027-01-01T08:00:00.000Z');
  });

  it('generates daily dates including the start and past occurrences (catch-up)', () => {
    const start = new Date('2026-08-10T08:00:00.000Z');
    const end = new Date('2026-08-13T08:00:00.000Z');
    const dates = generateRecurrenceDates({ start, recurrence: 'Day', end });

    expect(dates.map((d) => d.toISOString())).toEqual([
      '2026-08-10T08:00:00.000Z',
      '2026-08-11T08:00:00.000Z',
      '2026-08-12T08:00:00.000Z',
      '2026-08-13T08:00:00.000Z',
    ]);
  });

  it('generates weekly dates from a base that is already in the past', () => {
    const start = new Date('2026-08-01T08:00:00.000Z');
    const end = new Date('2026-08-20T08:00:00.000Z');
    const dates = generateRecurrenceDates({ start, recurrence: 'Week', end });

    expect(dates.map((d) => d.toISOString())).toEqual([
      '2026-08-01T08:00:00.000Z',
      '2026-08-08T08:00:00.000Z',
      '2026-08-15T08:00:00.000Z',
    ]);
  });

  it('generates monthly dates up to the horizon', () => {
    const start = new Date('2026-01-15T10:00:00.000Z');
    const end = new Date('2026-04-15T10:00:00.000Z');
    const dates = generateRecurrenceDates({ start, recurrence: 'Month', end });

    expect(dates).toHaveLength(4);
    expect(dates[0].toISOString()).toBe('2026-01-15T10:00:00.000Z');
    expect(dates[3].toISOString()).toBe('2026-04-15T10:00:00.000Z');
  });

  it('returns a single date when the end is the start', () => {
    const start = new Date('2026-08-10T08:00:00.000Z');
    const dates = generateRecurrenceDates({ start, recurrence: 'Year', end: start });

    expect(dates).toHaveLength(1);
  });

  it('does not mutate the start date', () => {
    const start = new Date('2026-08-10T08:00:00.000Z');
    generateRecurrenceDates({
      start,
      recurrence: 'Day',
      end: new Date('2026-08-12T08:00:00.000Z'),
    });

    expect(start.toISOString()).toBe('2026-08-10T08:00:00.000Z');
  });
});
