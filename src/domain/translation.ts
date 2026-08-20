import { CreateTranslationDto } from '@/dto/create-translation.dto';
import { UpdateTranslationDto } from '@/dto/update-translation.dto';
import { MAX_TRANSLATION_TEXT_LENGTH, SUPPORTED_LANGUAGES } from './constants';
import { DomainError } from './domain-error';
import { requireNonEmpty, requireSupportedLanguage, requireText } from './validation';

export class Translation {
  private _id: string | null = null;
  private _languageCode: string;
  private _text: string;
  private _selectionId: string;

  private constructor(languageCode: string, text: string, selectionId: string) {
    this._languageCode = languageCode;
    this._text = text;
    this._selectionId = selectionId;
  }

  static createNewTranslation(dto: CreateTranslationDto): Translation {
    const languageCode = requireSupportedLanguage(dto.languageCode, SUPPORTED_LANGUAGES);
    const text = requireText(dto.text, 'text', MAX_TRANSLATION_TEXT_LENGTH);
    const selectionId = requireNonEmpty(dto.selectionId, 'selectionId');
    return new Translation(languageCode, text, selectionId);
  }

  updateTranslation(dto: UpdateTranslationDto): void {
    if (dto.text !== undefined) {
      this._text = requireText(dto.text, 'text', MAX_TRANSLATION_TEXT_LENGTH);
    }
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('Translation already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get languageCode(): string {
    return this._languageCode;
  }

  get text(): string {
    return this._text;
  }

  get selectionId(): string {
    return this._selectionId;
  }
}
