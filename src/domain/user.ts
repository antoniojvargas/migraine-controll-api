import { CreateUserDto } from '@/dto/create-user.dto';
import { UpdateUserDto } from '@/dto/update-user.dto';
import { DomainError } from './domain-error';
import { requireNonEmpty, validateEmail } from './validation';

export class User {
  private _id: string | null = null;
  private _email: string;
  private _externalId: string;
  private _originalEmail: string | null;

  private constructor(email: string, externalId: string, originalEmail: string | null) {
    this._email = email;
    this._externalId = externalId;
    this._originalEmail = originalEmail;
  }

  static createNewUser(dto: CreateUserDto): User {
    const email = validateEmail(dto.email);
    const externalId = requireNonEmpty(dto.externalId, 'externalId');
    return new User(email, externalId, null);
  }

  updateUser(dto: UpdateUserDto): void {
    if (dto.email !== undefined) {
      this._email = validateEmail(dto.email);
    }
    if (dto.originalEmail !== undefined) {
      this._originalEmail = dto.originalEmail === null ? null : validateEmail(dto.originalEmail);
    }
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('User already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get externalId(): string {
    return this._externalId;
  }

  get originalEmail(): string | null {
    return this._originalEmail;
  }
}
