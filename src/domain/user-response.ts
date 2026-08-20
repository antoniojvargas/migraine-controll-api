import { CreateUserResponseDto } from '@/dto/create-user-response.dto';
import { UpdateUserResponseDto } from '@/dto/update-user-response.dto';
import { MAX_ANSWER_TEXT_LENGTH } from './constants';
import { DomainError } from './domain-error';
import { Question } from './question';
import { optionalString, requireNonEmpty, requireText } from './validation';

export class UserResponse {
  private _id: string | null = null;
  private _userId: string;
  private _question: Question;
  private _selectionId: string | null;
  private _answerText: string | null;
  private _migraineLogId: string | null;
  private _preventiveTreatmentId: string | null;

  private constructor(
    userId: string,
    question: Question,
    selectionId: string | null,
    answerText: string | null,
    migraineLogId: string | null,
    preventiveTreatmentId: string | null,
  ) {
    this._userId = userId;
    this._question = question;
    this._selectionId = selectionId;
    this._answerText = answerText;
    this._migraineLogId = migraineLogId;
    this._preventiveTreatmentId = preventiveTreatmentId;
  }

  static createNewUserResponse(dto: CreateUserResponseDto): UserResponse {
    const userId = requireNonEmpty(dto.userId, 'userId');
    const { selectionId, answerText } = UserResponse.resolveAnswer(
      dto.question,
      dto.selectionId,
      dto.answerText,
    );
    const migraineLogId = optionalString(dto.migraineLogId, 'migraineLogId');
    const preventiveTreatmentId = optionalString(
      dto.preventiveTreatmentId,
      'preventiveTreatmentId',
    );
    return new UserResponse(
      userId,
      dto.question,
      selectionId,
      answerText,
      migraineLogId,
      preventiveTreatmentId,
    );
  }

  updateUserResponse(dto: UpdateUserResponseDto): void {
    if (dto.selectionId !== undefined || dto.answerText !== undefined) {
      const nextSelectionId = dto.selectionId !== undefined ? dto.selectionId : this._selectionId;
      const nextAnswerText = dto.answerText !== undefined ? dto.answerText : this._answerText;
      const resolved = UserResponse.resolveAnswer(this._question, nextSelectionId, nextAnswerText);
      this._selectionId = resolved.selectionId;
      this._answerText = resolved.answerText;
    }
    if (dto.migraineLogId !== undefined) {
      this._migraineLogId = optionalString(dto.migraineLogId, 'migraineLogId');
    }
    if (dto.preventiveTreatmentId !== undefined) {
      this._preventiveTreatmentId = optionalString(
        dto.preventiveTreatmentId,
        'preventiveTreatmentId',
      );
    }
  }

  private static resolveAnswer(
    question: Question,
    selectionId: string | null | undefined,
    answerText: string | null | undefined,
  ): { selectionId: string | null; answerText: string | null } {
    const hasSelection = selectionId !== undefined && selectionId !== null;
    const hasAnswerText = answerText !== undefined && answerText !== null;

    if (question.type === 'text') {
      if (hasSelection) {
        throw new DomainError('text questions cannot have a selection');
      }
      if (!hasAnswerText) {
        throw new DomainError('text questions require an answerText');
      }
      return {
        selectionId: null,
        answerText: requireText(answerText as string, 'answerText', MAX_ANSWER_TEXT_LENGTH),
      };
    }

    if (hasAnswerText) {
      throw new DomainError('choice questions cannot have an answerText');
    }
    if (!hasSelection) {
      throw new DomainError('choice questions require a selection');
    }
    return { selectionId: requireNonEmpty(selectionId as string, 'selectionId'), answerText: null };
  }

  assignId(id: string): void {
    if (this._id !== null) {
      throw new DomainError('UserResponse already has an id assigned');
    }
    this._id = id;
  }

  get id(): string | null {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get question(): Question {
    return this._question;
  }

  get selectionId(): string | null {
    return this._selectionId;
  }

  get answerText(): string | null {
    return this._answerText;
  }

  get migraineLogId(): string | null {
    return this._migraineLogId;
  }

  get preventiveTreatmentId(): string | null {
    return this._preventiveTreatmentId;
  }
}
