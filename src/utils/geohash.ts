const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const GEOHASH6_LENGTH = 6;

export interface DecodedGeohash {
  latitude: number;
  longitude: number;
}

export function encodeGeohash6(latitude: number, longitude: number): string {
  if (latitude < -90 || latitude > 90) {
    throw new Error('latitude must be between -90 and 90');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('longitude must be between -180 and 180');
  }

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let geohash = '';
  let bit = 0;
  let charBits = 0;
  let isEvenBit = true;

  while (geohash.length < GEOHASH6_LENGTH) {
    if (isEvenBit) {
      const mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        charBits = (charBits << 1) | 1;
        lonMin = mid;
      } else {
        charBits = charBits << 1;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        charBits = (charBits << 1) | 1;
        latMin = mid;
      } else {
        charBits = charBits << 1;
        latMax = mid;
      }
    }
    isEvenBit = !isEvenBit;

    bit += 1;
    if (bit === 5) {
      geohash += BASE32[charBits];
      bit = 0;
      charBits = 0;
    }
  }

  return geohash;
}

export function decodeGeohash6(geohash: string): DecodedGeohash {
  if (geohash.length !== GEOHASH6_LENGTH) {
    throw new Error('geohash must have 6 characters');
  }

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let isEvenBit = true;

  for (const char of geohash.toLowerCase()) {
    const charIndex = BASE32.indexOf(char);
    if (charIndex === -1) {
      throw new Error(`Invalid geohash character: ${char}`);
    }

    for (let n = 4; n >= 0; n--) {
      const bitValue = (charIndex >> n) & 1;
      if (isEvenBit) {
        const mid = (lonMin + lonMax) / 2;
        if (bitValue === 1) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (bitValue === 1) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEvenBit = !isEvenBit;
    }
  }

  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lonMin + lonMax) / 2,
  };
}
