import { CreateMigraineLogDto } from '@/dto/create-migraine-log.dto';
import { UpdateMigraineLogDto } from '@/dto/update-migraine-log.dto';
import { INTENSITY_MAX, INTENSITY_MIN } from './constants';
import { DomainError } from './domain-error';
import { optionalString, requireNonEmpty, requirePastDate, requireRange } from './validation';

export class MigraineLog {
  private _id: string | null = null;
  private _userId: string;
  private _sessionId: string | null;
  private _intensity: number;
  private _painLocation: string;
  private _startedAt: Date;
  private _endedAt: Date | null;

  private constructor(
    userId: string,
    sessionId: string | null,
    intensity: number,
    painLocation: string,
    startedAt: Date,
    endedAt: Date | null,
  ) {
    this._userId = userId;
    this._sessionId = sessionId;
    this._intensity = intensity;
    this._painLocation = painLocation;
    this._startedAt = startedAt;
    this._endedAt = endedAt;
  }

  static createNewMigraineLog(dto: CreateMigraineLogDto): MigraineLog {
    const userId = requireNonEmpty(dto.userId, 'userId');
    const sessionId = optionalString(dto.sessionId, 'sessionId');
    const intensity = requireRange(dto.intensity, 'intensity', INTENSITY_MIN, INTENSITY_MAX);
    const painLocation = requireNonEmpty(dto.painLocation, 'painLocation');
    const startedAt = requirePastDate(dto.startedAt, 'startedAt');
    const endedAt =
      dto.endedAt === undefined || dto.endedAt === null
        ? null
        : requirePastDate(dto.endedAt, 'endedAt');
    if (endedAt !== null && endedAt.getTime() < startedAt.getTime()) {
      throw new DomainError('endedAt must be after startedAt');
    }
    return new MigraineLog(userId, sessionId, intensity, painLocation, startedAt, endedAt);
  }

  updateMigraineLog(dto: UpdateMigraineLogDto): void {
    if (dto.sessionId !== undefined) {
      this._sessionId = optionalString(dto.sessionId, 'sessionId');
    }
    if (dto.intensity !== undefined) {
      this._intensity = requireRange(dto.intensity, 'intensity', INTENSITY_MIN, INTENSITY_MAX);
    }
    if (dto.painLocation !== undefined) {
      this._painLocation = requireNonEmpty(dto.painLocation, 'painLocation');
    }
    if (dto.endedAt !== undefined) {
      const endedAt = dto.endedAt === null ? null : requirePastDate(dto.endedAt, 'endedAt');
      if (endedAt !== null && endedAt.getTime() < this._startedAt.getTime()) {
        throw new DomainError('endedAt must be after startedAt');
      }
      this._endedAt = endedAt;
    }
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('MigraineLog already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  get intensity(): number {
    return this._intensity;
  }

  get painLocation(): string {
    return this._painLocation;
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get endedAt(): Date | null {
    return this._endedAt;
  }
}
