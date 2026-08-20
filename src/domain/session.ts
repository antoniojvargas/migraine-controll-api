import { CreateSessionDto } from '@/dto/create-session.dto';
import { UpdateSessionDto } from '@/dto/update-session.dto';
import {
  BATTERY_LEVEL_MAX,
  BATTERY_LEVEL_MIN,
  INTENSITY_MIN,
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
  PROGRAM_LIMITS,
  PROGRAMS,
  SESSION_DURATION_MIN,
} from './constants';
import { DomainError } from './domain-error';
import {
  optionalFloatRange,
  optionalSemver,
  optionalString,
  requireNonEmpty,
  requireOneOf,
  requireRange,
} from './validation';

export class Session {
  private _id: string | null = null;
  private _deviceId: string;
  private _progSelected: string;
  private _duration: number;
  private _maxIntensity: number;
  private _batteryLevel: number;
  private _latitude: number | null;
  private _longitude: number | null;
  private _appVersion: string | null;
  private _phoneManufacturer: string | null;
  private _phoneOsName: string | null;
  private _phoneOsVersion: string | null;
  private _treatmentId: string | null;

  private constructor(
    deviceId: string,
    progSelected: string,
    duration: number,
    maxIntensity: number,
    batteryLevel: number,
    latitude: number | null,
    longitude: number | null,
    appVersion: string | null,
    phoneManufacturer: string | null,
    phoneOsName: string | null,
    phoneOsVersion: string | null,
    treatmentId: string | null,
  ) {
    this._deviceId = deviceId;
    this._progSelected = progSelected;
    this._duration = duration;
    this._maxIntensity = maxIntensity;
    this._batteryLevel = batteryLevel;
    this._latitude = latitude;
    this._longitude = longitude;
    this._appVersion = appVersion;
    this._phoneManufacturer = phoneManufacturer;
    this._phoneOsName = phoneOsName;
    this._phoneOsVersion = phoneOsVersion;
    this._treatmentId = treatmentId;
  }

  static createNewSession(dto: CreateSessionDto): Session {
    const deviceId = requireNonEmpty(dto.deviceId, 'deviceId');
    const progSelected = requireOneOf(dto.progSelected, PROGRAMS, 'progSelected');
    const limits = PROGRAM_LIMITS[progSelected];
    const duration = requireRange(
      dto.duration,
      'duration',
      SESSION_DURATION_MIN,
      limits.durationMax,
    );
    const maxIntensity = requireRange(
      dto.maxIntensity,
      'maxIntensity',
      INTENSITY_MIN,
      limits.intensityMax,
    );
    const batteryLevel = requireRange(
      dto.batteryLevel,
      'batteryLevel',
      BATTERY_LEVEL_MIN,
      BATTERY_LEVEL_MAX,
    );
    const latitude = optionalFloatRange(dto.latitude, 'latitude', LATITUDE_MIN, LATITUDE_MAX);
    const longitude = optionalFloatRange(dto.longitude, 'longitude', LONGITUDE_MIN, LONGITUDE_MAX);
    const appVersion = optionalSemver(dto.appVersion, 'appVersion');
    const phoneManufacturer = optionalString(dto.phoneManufacturer, 'phoneManufacturer');
    const phoneOsName = optionalString(dto.phoneOsName, 'phoneOsName');
    const phoneOsVersion = optionalString(dto.phoneOsVersion, 'phoneOsVersion');
    const treatmentId = optionalString(dto.treatmentId, 'treatmentId');
    return new Session(
      deviceId,
      progSelected,
      duration,
      maxIntensity,
      batteryLevel,
      latitude,
      longitude,
      appVersion,
      phoneManufacturer,
      phoneOsName,
      phoneOsVersion,
      treatmentId,
    );
  }

  updateSession(dto: UpdateSessionDto): void {
    const nextProgSelected =
      dto.progSelected !== undefined
        ? requireOneOf(dto.progSelected, PROGRAMS, 'progSelected')
        : this._progSelected;
    if (dto.progSelected !== undefined) {
      this._progSelected = nextProgSelected;
    }
    const limits = PROGRAM_LIMITS[nextProgSelected];
    if (dto.duration !== undefined) {
      this._duration = requireRange(
        dto.duration,
        'duration',
        SESSION_DURATION_MIN,
        limits.durationMax,
      );
    }
    if (dto.maxIntensity !== undefined) {
      this._maxIntensity = requireRange(
        dto.maxIntensity,
        'maxIntensity',
        INTENSITY_MIN,
        limits.intensityMax,
      );
    }
    if (dto.batteryLevel !== undefined) {
      this._batteryLevel = requireRange(
        dto.batteryLevel,
        'batteryLevel',
        BATTERY_LEVEL_MIN,
        BATTERY_LEVEL_MAX,
      );
    }
    if (dto.latitude !== undefined) {
      this._latitude = optionalFloatRange(dto.latitude, 'latitude', LATITUDE_MIN, LATITUDE_MAX);
    }
    if (dto.longitude !== undefined) {
      this._longitude = optionalFloatRange(
        dto.longitude,
        'longitude',
        LONGITUDE_MIN,
        LONGITUDE_MAX,
      );
    }
    if (dto.appVersion !== undefined) {
      this._appVersion = optionalSemver(dto.appVersion, 'appVersion');
    }
    if (dto.phoneManufacturer !== undefined) {
      this._phoneManufacturer = optionalString(dto.phoneManufacturer, 'phoneManufacturer');
    }
    if (dto.phoneOsName !== undefined) {
      this._phoneOsName = optionalString(dto.phoneOsName, 'phoneOsName');
    }
    if (dto.phoneOsVersion !== undefined) {
      this._phoneOsVersion = optionalString(dto.phoneOsVersion, 'phoneOsVersion');
    }
    if (dto.treatmentId !== undefined) {
      this._treatmentId = optionalString(dto.treatmentId, 'treatmentId');
    }
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('Session already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get deviceId(): string {
    return this._deviceId;
  }

  get progSelected(): string {
    return this._progSelected;
  }

  get duration(): number {
    return this._duration;
  }

  get maxIntensity(): number {
    return this._maxIntensity;
  }

  get batteryLevel(): number {
    return this._batteryLevel;
  }

  get latitude(): number | null {
    return this._latitude;
  }

  get longitude(): number | null {
    return this._longitude;
  }

  get appVersion(): string | null {
    return this._appVersion;
  }

  get phoneManufacturer(): string | null {
    return this._phoneManufacturer;
  }

  get phoneOsName(): string | null {
    return this._phoneOsName;
  }

  get phoneOsVersion(): string | null {
    return this._phoneOsVersion;
  }

  get treatmentId(): string | null {
    return this._treatmentId;
  }
}
