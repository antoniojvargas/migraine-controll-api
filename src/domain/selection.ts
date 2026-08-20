import { CreateSelectionDto } from '@/dto/create-selection.dto';
import { UpdateSelectionDto } from '@/dto/update-selection.dto';
import { DomainError } from './domain-error';
import { requireNonEmpty, requireNonNegativeInt } from './validation';

export class Selection {
  private _id: string | null = null;
  private _key: string;
  private _order: number;
  private _questionId: string;

  private constructor(key: string, order: number, questionId: string) {
    this._key = key;
    this._order = order;
    this._questionId = questionId;
  }

  static createNewSelection(dto: CreateSelectionDto): Selection {
    const key = requireNonEmpty(dto.key, 'key');
    const order = requireNonNegativeInt(dto.order, 'order');
    if (dto.question.type === 'text') {
      throw new DomainError('text questions cannot have selections');
    }
    const questionId = dto.question.id;
    if (questionId === null) {
      throw new DomainError('question must be persisted before creating a selection');
    }
    return new Selection(key, order, questionId);
  }

  updateSelection(dto: UpdateSelectionDto): void {
    if (dto.key !== undefined) {
      this._key = requireNonEmpty(dto.key, 'key');
    }
    if (dto.order !== undefined) {
      this._order = requireNonNegativeInt(dto.order, 'order');
    }
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('Selection already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get key(): string {
    return this._key;
  }

  get order(): number {
    return this._order;
  }

  get questionId(): string {
    return this._questionId;
  }
}
