import { MigraineLogEntity } from '@/infra/database/entities';
import { groupLogsByLocalDate } from '@/utils/calendar-group';
import { DomainError } from '@/domain/domain-error';

const log = (id: string, startedAt: string): MigraineLogEntity =>
  ({
    id,
    user: { id: 'u-1' },
    session: null,
    intensity: 50,
    painLocation: 'frontal',
    startedAt: new Date(startedAt),
    endedAt: null,
  }) as MigraineLogEntity;

describe('calendar-group helper', () => {
  it('groups logs by local year/month/day in the given timezone', () => {
    const groups = groupLogsByLocalDate(
      [
        log('l-1', '2026-08-20T01:30:00.000Z'),
        log('l-2', '2026-08-20T02:00:00.000Z'),
        log('l-3', '2026-09-02T00:00:00.000Z'),
      ],
      'UTC',
    );

    expect(groups).toEqual([
      {
        year: 2026,
        month: 8,
        days: [
          {
            day: 20,
            logs: [expect.objectContaining({ id: 'l-1' }), expect.objectContaining({ id: 'l-2' })],
          },
        ],
      },
      { year: 2026, month: 9, days: [{ day: 2, logs: [expect.objectContaining({ id: 'l-3' })] }] },
    ]);
  });

  it('buckets by local date respecting the timezone offset', () => {
    const groups = groupLogsByLocalDate(
      [log('l-1', '2026-08-20T04:00:00.000Z')],
      'America/New_York',
    );

    expect(groups[0]).toMatchObject({
      year: 2026,
      month: 8,
      days: [{ day: 20, logs: [expect.objectContaining({ id: 'l-1' })] }],
    });

    const shifted = groupLogsByLocalDate(
      [log('l-2', '2026-08-20T01:00:00.000Z')],
      'America/Mexico_City',
    );
    expect(shifted[0]).toMatchObject({
      year: 2026,
      month: 8,
      days: [{ day: 19, logs: [expect.objectContaining({ id: 'l-2' })] }],
    });
  });

  it('returns an empty month list when there are no logs', () => {
    expect(groupLogsByLocalDate([], 'UTC')).toEqual([]);
  });

  it('rejects an invalid timezone', () => {
    expect(() => groupLogsByLocalDate([], 'Not/AZone')).toThrow(DomainError);
  });
});
