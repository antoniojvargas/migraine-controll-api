import { Session } from '@/domain/session';
import { DomainError } from '@/domain/domain-error';

const validDto = () => ({
  deviceId: 'd-1',
  progSelected: 'p1',
  duration: 45,
  maxIntensity: 50,
  batteryLevel: 75,
});

describe('Session domain', () => {
  it('creates a valid session', () => {
    const session = Session.createNewSession(validDto());

    expect(session.id).toBeNull();
    expect(session.deviceId).toBe('d-1');
    expect(session.progSelected).toBe('p1');
    expect(session.duration).toBe(45);
    expect(session.maxIntensity).toBe(50);
    expect(session.batteryLevel).toBe(75);
    expect(session.latitude).toBeNull();
    expect(session.longitude).toBeNull();
  });

  it('accepts optional geo, phone and treatment fields', () => {
    const session = Session.createNewSession({
      ...validDto(),
      latitude: 40.4,
      longitude: -3.7,
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      treatmentId: 't-1',
    });

    expect(session.latitude).toBe(40.4);
    expect(session.longitude).toBe(-3.7);
    expect(session.appVersion).toBe('1.0.0');
    expect(session.phoneManufacturer).toBe('Apple');
    expect(session.treatmentId).toBe('t-1');
  });

  it.each([-1, 61, 1.5])('rejects invalid duration for p1 %p', (duration) => {
    expect(() => Session.createNewSession({ ...validDto(), duration })).toThrow(DomainError);
  });

  it.each([-1, 71])('rejects invalid maxIntensity for p1 %p', (maxIntensity) => {
    expect(() => Session.createNewSession({ ...validDto(), maxIntensity })).toThrow(DomainError);
  });

  it.each([
    ['p2', 46, 51],
    ['p3', 31, 31],
  ])('applies per-program limits for %p', (progSelected, duration, maxIntensity) => {
    expect(() => Session.createNewSession({ ...validDto(), progSelected, duration })).toThrow(
      DomainError,
    );
    expect(() => Session.createNewSession({ ...validDto(), progSelected, maxIntensity })).toThrow(
      DomainError,
    );
  });

  it('rejects an unknown program', () => {
    expect(() => Session.createNewSession({ ...validDto(), progSelected: 'p4' })).toThrow(
      DomainError,
    );
  });

  it.each([-1, 101])('rejects invalid batteryLevel %p', (batteryLevel) => {
    expect(() => Session.createNewSession({ ...validDto(), batteryLevel })).toThrow(DomainError);
  });

  it.each([
    [-91, 0],
    [91, 0],
    [0, -181],
    [0, 181],
  ])('rejects out of range coordinates %p', (latitude, longitude) => {
    expect(() => Session.createNewSession({ ...validDto(), latitude, longitude })).toThrow(
      DomainError,
    );
  });

  it('rejects empty deviceId and progSelected', () => {
    expect(() => Session.createNewSession({ ...validDto(), deviceId: '' })).toThrow(DomainError);
    expect(() => Session.createNewSession({ ...validDto(), progSelected: ' ' })).toThrow(
      DomainError,
    );
  });

  it('updates session fields', () => {
    const session = Session.createNewSession(validDto());

    session.updateSession({ duration: 50, longitude: null, treatmentId: 't-1' });

    expect(session.duration).toBe(50);
    expect(session.longitude).toBeNull();
    expect(session.treatmentId).toBe('t-1');
  });

  it('rejects an invalid update', () => {
    const session = Session.createNewSession(validDto());

    expect(() => session.updateSession({ duration: 61 })).toThrow(DomainError);
    expect(session.duration).toBe(45);
  });

  it('applies the new program limits when progSelected is updated', () => {
    const session = Session.createNewSession(validDto());

    expect(() => session.updateSession({ progSelected: 'p3', duration: 45 })).toThrow(DomainError);
    session.updateSession({ progSelected: 'p3', duration: 25, maxIntensity: 28 });

    expect(session.progSelected).toBe('p3');
    expect(session.duration).toBe(25);
    expect(session.maxIntensity).toBe(28);
  });

  it('assigns id only once', () => {
    const session = Session.createNewSession(validDto());

    session.assignId('s-1');

    expect(session.id).toBe('s-1');
    expect(() => session.assignId('s-2')).toThrow(DomainError);
  });
});
