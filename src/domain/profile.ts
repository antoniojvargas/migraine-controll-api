import { CreateProfileDto } from '@/dto/create-profile.dto';
import { UpdateProfileDto } from '@/dto/update-profile.dto';
import { DomainError } from './domain-error';
import {
  optionalSemver,
  requireGeohash6,
  requireLanguage,
  requireNonEmpty,
  requireOneOf,
  requirePastDate,
} from './validation';

const GENDERS = ['f', 'm', 'nb'] as const;

export class Profile {
  private _id: string | null = null;
  private _userId: string;
  private _name: string;
  private _gender: string;
  private _birthDate: Date;
  private _language: string;
  private _geohash6: string;
  private _appVersion: string | null;
  private _hasTakenSurvey: boolean;

  private constructor(
    userId: string,
    name: string,
    gender: string,
    birthDate: Date,
    language: string,
    geohash6: string,
    appVersion: string | null,
    hasTakenSurvey: boolean,
  ) {
    this._userId = userId;
    this._name = name;
    this._gender = gender;
    this._birthDate = birthDate;
    this._language = language;
    this._geohash6 = geohash6;
    this._appVersion = appVersion;
    this._hasTakenSurvey = hasTakenSurvey;
  }

  static createNewProfile(dto: CreateProfileDto): Profile {
    const userId = requireNonEmpty(dto.userId, 'userId');
    const name = requireNonEmpty(dto.name, 'name');
    const gender = requireOneOf(dto.gender, GENDERS, 'gender');
    const birthDate = requirePastDate(dto.birthDate, 'birthDate');
    const language = requireLanguage(dto.language);
    const geohash6 = requireGeohash6(dto.geohash6);
    const appVersion = optionalSemver(dto.appVersion, 'appVersion');
    const hasTakenSurvey = dto.hasTakenSurvey ?? false;
    return new Profile(
      userId,
      name,
      gender,
      birthDate,
      language,
      geohash6,
      appVersion,
      hasTakenSurvey,
    );
  }

  updateProfile(dto: UpdateProfileDto): void {
    if (dto.name !== undefined) {
      this._name = requireNonEmpty(dto.name, 'name');
    }
    if (dto.gender !== undefined) {
      this._gender = requireOneOf(dto.gender, GENDERS, 'gender');
    }
    if (dto.birthDate !== undefined) {
      this._birthDate = requirePastDate(dto.birthDate, 'birthDate');
    }
    if (dto.language !== undefined) {
      this._language = requireLanguage(dto.language);
    }
    if (dto.geohash6 !== undefined) {
      this._geohash6 = requireGeohash6(dto.geohash6);
    }
    if (dto.appVersion !== undefined) {
      this._appVersion = optionalSemver(dto.appVersion, 'appVersion');
    }
    if (dto.hasTakenSurvey !== undefined) {
      this._hasTakenSurvey = dto.hasTakenSurvey;
    }
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('Profile already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get gender(): string {
    return this._gender;
  }

  get birthDate(): Date {
    return this._birthDate;
  }

  get language(): string {
    return this._language;
  }

  get geohash6(): string {
    return this._geohash6;
  }

  get appVersion(): string | null {
    return this._appVersion;
  }

  get hasTakenSurvey(): boolean {
    return this._hasTakenSurvey;
  }
}
