import { CreateDeviceDto } from '@/dto/create-device.dto';
import { UpdateDeviceDto } from '@/dto/update-device.dto';
import { DomainError } from './domain-error';
import { optionalSemver, optionalString, requireNonEmpty, requireOneOf } from './validation';

const DEVICE_STATUSES = ['active', 'inactive'] as const;

export class Device {
  private _id: string | null = null;
  private _profileId: string;
  private _status: string;
  private _appVersion: string | null;
  private _phoneManufacturer: string | null;
  private _phoneOsName: string | null;
  private _phoneOsVersion: string | null;

  private constructor(
    profileId: string,
    status: string,
    appVersion: string | null,
    phoneManufacturer: string | null,
    phoneOsName: string | null,
    phoneOsVersion: string | null,
  ) {
    this._profileId = profileId;
    this._status = status;
    this._appVersion = appVersion;
    this._phoneManufacturer = phoneManufacturer;
    this._phoneOsName = phoneOsName;
    this._phoneOsVersion = phoneOsVersion;
  }

  static createNewDevice(dto: CreateDeviceDto): Device {
    const profileId = requireNonEmpty(dto.profileId, 'profileId');
    const status = requireOneOf(dto.status, DEVICE_STATUSES, 'status');
    const appVersion = optionalSemver(dto.appVersion, 'appVersion');
    const phoneManufacturer = optionalString(dto.phoneManufacturer, 'phoneManufacturer');
    const phoneOsName = optionalString(dto.phoneOsName, 'phoneOsName');
    const phoneOsVersion = optionalString(dto.phoneOsVersion, 'phoneOsVersion');
    return new Device(
      profileId,
      status,
      appVersion,
      phoneManufacturer,
      phoneOsName,
      phoneOsVersion,
    );
  }

  updateDevice(dto: UpdateDeviceDto): void {
    if (dto.status !== undefined) {
      this._status = requireOneOf(dto.status, DEVICE_STATUSES, 'status');
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
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('Device already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get profileId(): string {
    return this._profileId;
  }

  get status(): string {
    return this._status;
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
}
