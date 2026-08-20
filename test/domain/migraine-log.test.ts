import { MigraineLog } from '@/domain/migraine-log';
import { DomainError } from '@/domain/domain-error';

const startedAt = new Date('2026-08-19T10:00:00Z');
const validDto = () => ({ userId: 'u-1', intensity: 50, painLocation: 'frontal', startedAt });

describe('MigraineLog domain', () => {
  it('creates a valid log without endedAt', () => {
    const log = MigraineLog.createNewMigraineLog(validDto());

    expect(log.id).toBeNull();
    expect(log.userId).toBe('u-1');
    expect(log.intensity).toBe(50);
    expect(log.painLocation).toBe('frontal');
    expect(log.startedAt).toEqual(startedAt);
    expect(log.endedAt).toBeNull();
    expect(log.sessionId).toBeNull();
  });

  it('creates a log with coherent endedAt', () => {
    const endedAt = new Date('2026-08-19T11:00:00Z');
    const log = MigraineLog.createNewMigraineLog({ ...validDto(), sessionId: 's-1', endedAt });

    expect(log.sessionId).toBe('s-1');
    expect(log.endedAt).toEqual(endedAt);
  });

  it.each([-1, 101])('rejects invalid intensity %p', (intensity) => {
    expect(() => MigraineLog.createNewMigraineLog({ ...validDto(), intensity })).toThrow(
      DomainError,
    );
  });

  it('rejects endedAt before startedAt', () => {
    expect(() =>
      MigraineLog.createNewMigraineLog({
        ...validDto(),
        endedAt: new Date('2026-08-19T09:00:00Z'),
      }),
    ).toThrow(DomainError);
  });

  it('rejects a future startedAt', () => {
    expect(() =>
      MigraineLog.createNewMigraineLog({
        ...validDto(),
        startedAt: new Date('2099-01-01T10:00:00Z'),
      }),
    ).toThrow(DomainError);
  });

  it('rejects an empty painLocation', () => {
    expect(() => MigraineLog.createNewMigraineLog({ ...validDto(), painLocation: ' ' })).toThrow(
      DomainError,
    );
  });

  it('updates a log', () => {
    const log = MigraineLog.createNewMigraineLog(validDto());

    log.updateMigraineLog({
      intensity: 90,
      sessionId: 's-1',
      endedAt: new Date('2026-08-19T11:00:00Z'),
    });

    expect(log.intensity).toBe(90);
    expect(log.sessionId).toBe('s-1');
    expect(log.endedAt).toEqual(new Date('2026-08-19T11:00:00Z'));
  });

  it('rejects an incoherent update', () => {
    const log = MigraineLog.createNewMigraineLog(validDto());

    expect(() => log.updateMigraineLog({ endedAt: new Date('2026-08-19T09:00:00Z') })).toThrow(
      DomainError,
    );
    expect(log.endedAt).toBeNull();
  });

  it('assigns id only once', () => {
    const log = MigraineLog.createNewMigraineLog(validDto());

    log.assignId('log-1');

    expect(log.id).toBe('log-1');
    expect(() => log.assignId('log-2')).toThrow(DomainError);
  });
});
