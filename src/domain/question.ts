import { CreateQuestionDto } from '@/dto/create-question.dto';
import { UpdateQuestionDto } from '@/dto/update-question.dto';
import { QUESTION_TYPES } from './constants';
import { DomainError } from './domain-error';
import { requireNonEmpty, requireNonNegativeInt, requireOneOf } from './validation';

export class Question {
  private _id: string | null = null;
  private _key: string;
  private _type: string;
  private _order: number;

  private constructor(key: string, type: string, order: number) {
    this._key = key;
    this._type = type;
    this._order = order;
  }

  static createNewQuestion(dto: CreateQuestionDto): Question {
    const key = requireNonEmpty(dto.key, 'key');
    const type = requireOneOf(dto.type, QUESTION_TYPES, 'type');
    const order = requireNonNegativeInt(dto.order, 'order');
    return new Question(key, type, order);
  }

  updateQuestion(dto: UpdateQuestionDto): void {
    if (dto.key !== undefined) {
      this._key = requireNonEmpty(dto.key, 'key');
    }
    if (dto.type !== undefined) {
      this._type = requireOneOf(dto.type, QUESTION_TYPES, 'type');
    }
    if (dto.order !== undefined) {
      this._order = requireNonNegativeInt(dto.order, 'order');
    }
  }

  isChoiceType(): boolean {
    return this._type !== 'text';
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('Question already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get key(): string {
    return this._key;
  }

  get type(): string {
    return this._type;
  }

  get order(): number {
    return this._order;
  }
}
