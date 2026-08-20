import { Profile } from '@/domain/profile';
import { DomainError } from '@/domain/domain-error';

const validDto = () => ({
  userId: 'u-1',
  name: 'Ana',
  gender: 'f',
  birthDate: '1990-05-10',
  language: 'ES',
  geohash6: 'DZN6C6',
});

describe('Profile domain', () => {
  it('creates a valid profile with defaults and normalizations', () => {
    const profile = Profile.createNewProfile(validDto());

    expect(profile.id).toBeNull();
    expect(profile.userId).toBe('u-1');
    expect(profile.name).toBe('Ana');
    expect(profile.language).toBe('es');
    expect(profile.geohash6).toBe('dzn6c6');
    expect(profile.appVersion).toBeNull();
    expect(profile.hasTakenSurvey).toBe(false);
  });

  it('accepts optional appVersion and hasTakenSurvey', () => {
    const profile = Profile.createNewProfile({
      ...validDto(),
      appVersion: '1.2.3',
      hasTakenSurvey: true,
    });

    expect(profile.appVersion).toBe('1.2.3');
    expect(profile.hasTakenSurvey).toBe(true);
  });

  it.each(['', 'x', 'otro'])('rejects invalid gender %p', (gender) => {
    expect(() => Profile.createNewProfile({ ...validDto(), gender })).toThrow(DomainError);
  });

  it('rejects a future birthDate', () => {
    expect(() => Profile.createNewProfile({ ...validDto(), birthDate: '2099-01-01' })).toThrow(
      DomainError,
    );
  });

  it('rejects an invalid birthDate', () => {
    expect(() => Profile.createNewProfile({ ...validDto(), birthDate: 'no-es-fecha' })).toThrow(
      DomainError,
    );
  });

  it('rejects an invalid geohash6', () => {
    expect(() => Profile.createNewProfile({ ...validDto(), geohash6: 'abc' })).toThrow(DomainError);
  });

  it('rejects an empty name', () => {
    expect(() => Profile.createNewProfile({ ...validDto(), name: ' ' })).toThrow(DomainError);
  });

  it('rejects an invalid appVersion', () => {
    expect(() => Profile.createNewProfile({ ...validDto(), appVersion: 'v1' })).toThrow(
      DomainError,
    );
  });

  it('updates profile fields', () => {
    const profile = Profile.createNewProfile(validDto());

    profile.updateProfile({
      name: 'Ana María',
      gender: 'nb',
      hasTakenSurvey: true,
      appVersion: null,
    });

    expect(profile.name).toBe('Ana María');
    expect(profile.gender).toBe('nb');
    expect(profile.hasTakenSurvey).toBe(true);
    expect(profile.appVersion).toBeNull();
  });

  it('rejects an invalid update and keeps state', () => {
    const profile = Profile.createNewProfile(validDto());

    expect(() => profile.updateProfile({ gender: 'x' })).toThrow(DomainError);
    expect(profile.gender).toBe('f');
  });

  it('assigns id only once', () => {
    const profile = Profile.createNewProfile(validDto());

    profile.assignId('p-1');

    expect(profile.id).toBe('p-1');
    expect(() => profile.assignId('p-2')).toThrow(DomainError);
  });
});
