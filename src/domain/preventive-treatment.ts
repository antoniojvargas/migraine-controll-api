import { CreatePreventiveTreatmentDto } from '@/dto/create-preventive-treatment.dto';
import { UpdatePreventiveTreatmentDto } from '@/dto/update-preventive-treatment.dto';
import { TREATMENT_NAME_MAX_LENGTH } from './constants';
import { DomainError } from './domain-error';
import { requireFutureDate, requireNonEmpty, requireText } from './validation';

export class PreventiveTreatment {
  private _id: string | null = null;
  private _userId: string;
  private _name: string;
  private _isRecurrent: boolean;
  private _repeatUntil: Date | null;

  private constructor(
    userId: string,
    name: string,
    isRecurrent: boolean,
    repeatUntil: Date | null,
  ) {
    this._userId = userId;
    this._name = name;
    this._isRecurrent = isRecurrent;
    this._repeatUntil = repeatUntil;
  }

  static createNewPreventiveTreatment(dto: CreatePreventiveTreatmentDto): PreventiveTreatment {
    const userId = requireNonEmpty(dto.userId, 'userId');
    const name = requireText(dto.name, 'name', TREATMENT_NAME_MAX_LENGTH);
    const isRecurrent = dto.isRecurrent ?? false;
    const repeatUntil =
      dto.repeatUntil === undefined || dto.repeatUntil === null
        ? null
        : requireFutureDate(dto.repeatUntil, 'repeatUntil');
    if (repeatUntil !== null && !isRecurrent) {
      throw new DomainError('repeatUntil requires isRecurrent to be true');
    }
    return new PreventiveTreatment(userId, name, isRecurrent, repeatUntil);
  }

  updatePreventiveTreatment(dto: UpdatePreventiveTreatmentDto): void {
    if (dto.name !== undefined) {
      this._name = requireText(dto.name, 'name', TREATMENT_NAME_MAX_LENGTH);
    }
    if (dto.isRecurrent !== undefined) {
      this._isRecurrent = dto.isRecurrent;
    }
    if (dto.repeatUntil !== undefined) {
      const repeatUntil =
        dto.repeatUntil === null ? null : requireFutureDate(dto.repeatUntil, 'repeatUntil');
      if (repeatUntil !== null && !this._isRecurrent) {
        throw new DomainError('repeatUntil requires isRecurrent to be true');
      }
      this._repeatUntil = repeatUntil;
    }
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('PreventiveTreatment already has an id assigned');
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

  get isRecurrent(): boolean {
    return this._isRecurrent;
  }

  get repeatUntil(): Date | null {
    return this._repeatUntil;
  }
}
