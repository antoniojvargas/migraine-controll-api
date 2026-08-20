import { Session } from '@/domain/session';
import { DomainError } from '@/domain/domain-error';

const validDto = () => ({
  deviceId: 'd-1',
  progSelected: 'P1',
  duration: 45,
  maxIntensity: 80,
  batteryLevel: 75,
});

describe('Session domain', () => {
  it('creates a valid session', () => {
    const session = Session.createNewSession(validDto());

    expect(session.id).toBeNull();
    expect(session.deviceId).toBe('d-1');
    expect(session.progSelected).toBe('P1');
    expect(session.duration).toBe(45);
    expect(session.maxIntensity).toBe(80);
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

  it.each([-1, 91, 1.5])('rejects invalid duration %p', (duration) => {
    expect(() => Session.createNewSession({ ...validDto(), duration })).toThrow(DomainError);
  });

  it.each([-1, 101])('rejects invalid maxIntensity %p', (maxIntensity) => {
    expect(() => Session.createNewSession({ ...validDto(), maxIntensity })).toThrow(DomainError);
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

    session.updateSession({ duration: 90, longitude: null, treatmentId: 't-1' });

    expect(session.duration).toBe(90);
    expect(session.longitude).toBeNull();
    expect(session.treatmentId).toBe('t-1');
  });

  it('rejects an invalid update', () => {
    const session = Session.createNewSession(validDto());

    expect(() => session.updateSession({ duration: 120 })).toThrow(DomainError);
    expect(session.duration).toBe(45);
  });

  it('assigns id only once', () => {
    const session = Session.createNewSession(validDto());

    session.assignId('s-1');

    expect(session.id).toBe('s-1');
    expect(() => session.assignId('s-2')).toThrow(DomainError);
  });
});
