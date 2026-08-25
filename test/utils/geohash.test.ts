import { decodeGeohash6, encodeGeohash6 } from '@/utils/geohash';

describe('encodeGeohash6', () => {
  it('matches the well-known reference geohash for Jutland, Denmark', () => {
    expect(encodeGeohash6(57.64911, 10.40744)).toBe('u4pruy');
  });

  it('matches the well-known reference geohash for the null island (0, 0)', () => {
    expect(encodeGeohash6(0, 0)).toBe('s00000');
  });

  it('matches the well-known reference geohash for Sydney, Australia', () => {
    expect(encodeGeohash6(-33.8688, 151.2093)).toBe('r3gx2f');
  });

  it('returns a 6-character lowercase base32 string', () => {
    const geohash = encodeGeohash6(40.7128, -74.006);
    expect(geohash).toMatch(/^[0-9b-hjkmnp-z]{6}$/);
  });

  it('throws for an out-of-range latitude', () => {
    expect(() => encodeGeohash6(90.5, 0)).toThrow('latitude must be between -90 and 90');
    expect(() => encodeGeohash6(-90.5, 0)).toThrow('latitude must be between -90 and 90');
  });

  it('throws for an out-of-range longitude', () => {
    expect(() => encodeGeohash6(0, 180.5)).toThrow('longitude must be between -180 and 180');
    expect(() => encodeGeohash6(0, -180.5)).toThrow('longitude must be between -180 and 180');
  });
});

describe('decodeGeohash6', () => {
  it('decodes a known geohash back to its approximate coordinates', () => {
    const { latitude, longitude } = decodeGeohash6('u4pruy');
    expect(latitude).toBeCloseTo(57.64911, 1);
    expect(longitude).toBeCloseTo(10.40744, 1);
  });

  it('is case-insensitive', () => {
    expect(decodeGeohash6('U4PRUY')).toEqual(decodeGeohash6('u4pruy'));
  });

  it('throws for a geohash with an invalid length', () => {
    expect(() => decodeGeohash6('u4pru')).toThrow('geohash must have 6 characters');
    expect(() => decodeGeohash6('u4pruyz')).toThrow('geohash must have 6 characters');
  });

  it('throws for a geohash with an invalid character', () => {
    expect(() => decodeGeohash6('u4prui')).toThrow('Invalid geohash character: i');
  });
});

describe('encode/decode precision round trip', () => {
  const points: [number, number][] = [
    [57.64911, 10.40744],
    [-33.8688, 151.2093],
    [40.7128, -74.006],
    [0, 0],
    [89.9, 179.9],
    [-89.9, -179.9],
  ];

  it.each(points)('recovers latitude and longitude %p within a ~0.01 degree cell', (lat, lon) => {
    const geohash = encodeGeohash6(lat, lon);
    const decoded = decodeGeohash6(geohash);

    expect(Math.abs(decoded.latitude - lat)).toBeLessThanOrEqual(0.003);
    expect(Math.abs(decoded.longitude - lon)).toBeLessThanOrEqual(0.006);
  });
});
