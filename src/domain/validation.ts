import { DomainError } from './domain-error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
const GEOHASH_REGEX = /^[0-9a-z]{6}$/i;
const LANGUAGE_REGEX = /^[a-z]{2,3}$/i;

export function requireNonEmpty(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DomainError(`${field} is required`);
  }
  return value.trim();
}

export function requireOneOf(value: string, allowed: readonly string[], field: string): string {
  const normalized = requireNonEmpty(value, field);
  if (!allowed.includes(normalized)) {
    throw new DomainError(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return normalized;
}

export function optionalString(value: string | null | undefined, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return requireNonEmpty(value, field);
}

export function validateEmail(value: string): string {
  const email = requireNonEmpty(value, 'email').toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new DomainError('email has an invalid format');
  }
  return email;
}

export function requireLanguage(value: string): string {
  const language = requireNonEmpty(value, 'language').toLowerCase();
  if (!LANGUAGE_REGEX.test(language)) {
    throw new DomainError('language must be an ISO 639 code (2-3 letters)');
  }
  return language;
}

export function requireGeohash6(value: string): string {
  const geohash = requireNonEmpty(value, 'geohash6').toLowerCase();
  if (!GEOHASH_REGEX.test(geohash)) {
    throw new DomainError('geohash6 must have 6 alphanumeric characters');
  }
  return geohash;
}

export function requirePastDate(value: string | Date, field: string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new DomainError(`${field} has an invalid date format`);
  }
  if (date.getTime() > Date.now()) {
    throw new DomainError(`${field} must be in the past`);
  }
  return date;
}

export function requireDate(value: string | Date, field: string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new DomainError(`${field} has an invalid date format`);
  }
  return date;
}

export function optionalSemver(value: string | null | undefined, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const version = requireNonEmpty(value, field);
  if (!SEMVER_REGEX.test(version)) {
    throw new DomainError(`${field} must follow semver (e.g. 1.0.0)`);
  }
  return version;
}

export function requireNonNegativeInt(value: number, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new DomainError(`${field} must be a non-negative integer`);
  }
  return value;
}

export function requireText(value: string, field: string, maxLength: number): string {
  const text = requireNonEmpty(value, field);
  if (text.length > maxLength) {
    throw new DomainError(`${field} must not exceed ${maxLength} characters`);
  }
  return text;
}

export function requireSupportedLanguage(value: string, supported: readonly string[]): string {
  const language = requireNonEmpty(value, 'languageCode').toLowerCase();
  if (!supported.includes(language)) {
    throw new DomainError(`languageCode must be one of: ${supported.join(', ')}`);
  }
  return language;
}

export function requireRange(value: number, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new DomainError(`${field} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function requireFloatRange(value: number, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new DomainError(`${field} must be a number between ${min} and ${max}`);
  }
  return value;
}

export function optionalFloatRange(
  value: number | null | undefined,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return requireFloatRange(value, field, min, max);
}

export function requireFutureDate(value: string | Date, field: string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new DomainError(`${field} has an invalid date format`);
  }
  if (date.getTime() < Date.now()) {
    throw new DomainError(`${field} must be today or in the future`);
  }
  return date;
}
