import { randomUUID } from 'node:crypto';
import { DeepPartial } from 'typeorm';
import { UserResponse } from '@/domain/user-response';
import { Question } from '@/domain/question';
import { Selection } from '@/domain/selection';
import { Translation } from '@/domain/translation';
import { SUPPORTED_LANGUAGES } from '@/domain/constants';
import { DomainError } from '@/domain/domain-error';
import { requireNonEmpty, requireSupportedLanguage } from '@/domain/validation';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { UserResponseEntity, SelectionEntity, TranslationEntity } from '@/infra/database/entities';
import { UserResponseOutputDto } from '@/dto/user-response-output.dto';
import { AppError } from '@/utils/app-error';

export interface ResolvedAnswer {
  selectionId: string | null;
  answerText: string | null;
}

export interface PersistUserResponsesInput {
  userId: string;
  items: ReadonlyArray<{
    questionId: string;
    answerId?: string | null;
    answerText?: string | null;
    answerLanguageCode?: string;
  }>;
  migraineLogId?: string | null;
  preventiveTreatmentId?: string | null;
  /** Si es `true`, cada respuesta resuelta se fija como respuesta preferida del usuario cuando aún no tiene una para esa pregunta. */
  upsertPreferred?: boolean;
}

export abstract class UserResponseBaseUc {
  constructor(
    protected readonly userResponseRepository: UserResponseRepository,
    protected readonly questionRepository: QuestionRepository,
    protected readonly selectionRepository: SelectionRepository,
    protected readonly translationRepository: TranslationRepository,
    protected readonly preferredAnswersRepository?: PreferredAnswersRepository,
  ) {}

  protected async loadQuestion(
    questionId: string,
    cache?: Map<string, Question>,
  ): Promise<Question> {
    const id = requireNonEmpty(questionId, 'questionId');
    const cached = cache?.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const entity = await this.questionRepository.findOneBy({ id });
    if (entity === null) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
    }
    const question = Question.createNewQuestion({
      key: entity.key,
      type: entity.type,
      order: entity.order,
    });
    question.assignId(entity.id);
    cache?.set(id, question);
    return question;
  }

  protected async resolveAnswer(
    question: Question,
    answerId: string | null | undefined,
    answerText: string | null | undefined,
    answerLanguageCode: string | undefined,
  ): Promise<ResolvedAnswer> {
    const hasAnswerId = answerId !== undefined && answerId !== null;
    const hasAnswerText = answerText !== undefined && answerText !== null;

    if (question.type === 'text') {
      if (hasAnswerId) {
        throw new DomainError('text questions cannot have a selection');
      }
      return { selectionId: null, answerText: answerText ?? null };
    }

    if (hasAnswerId && hasAnswerText) {
      throw new DomainError('provide either answerId or answerText, not both');
    }
    if (hasAnswerId) {
      return { selectionId: answerId as string, answerText: null };
    }
    if (hasAnswerText) {
      const selectionId = await this.createCustomSelection(
        question,
        answerText as string,
        answerLanguageCode,
      );
      return { selectionId, answerText: null };
    }
    return { selectionId: null, answerText: null };
  }

  protected buildUserResponse(
    userId: string,
    question: Question,
    resolved: ResolvedAnswer,
    migraineLogId: string | null | undefined,
    preventiveTreatmentId: string | null | undefined,
  ): UserResponse {
    return UserResponse.createNewUserResponse({
      userId,
      question,
      selectionId: resolved.selectionId,
      answerText: resolved.answerText,
      migraineLogId,
      preventiveTreatmentId,
    });
  }

  protected mapUserResponseToEntity(response: UserResponse): DeepPartial<UserResponseEntity> {
    return {
      user: { id: response.userId },
      question: { id: response.question.id as string },
      selection: response.selectionId !== null ? { id: response.selectionId } : undefined,
      answerText: response.answerText,
      migraineLog: response.migraineLogId !== null ? { id: response.migraineLogId } : undefined,
      preventiveTreatment:
        response.preventiveTreatmentId !== null
          ? { id: response.preventiveTreatmentId }
          : undefined,
    };
  }

  protected toOutput(response: UserResponse): UserResponseOutputDto {
    return {
      id: response.id as string,
      userId: response.userId,
      questionId: response.question.id as string,
      selectionId: response.selectionId,
      answerText: response.answerText,
      migraineLogId: response.migraineLogId,
      preventiveTreatmentId: response.preventiveTreatmentId,
    };
  }

  /**
   * Resuelve y persiste en bloque un conjunto de respuestas de un usuario
   * (onboarding, log de migraña o tratamiento preventivo). Devuelve las
   * entidades de dominio con su id ya asignado. Reemplaza el bucle
   * loadQuestion → resolveAnswer → buildUserResponse → bulkCreate → assignId
   * que estaba duplicado en tres casos de uso.
   */
  protected async persistUserResponses(input: PersistUserResponsesInput): Promise<UserResponse[]> {
    const {
      userId,
      items,
      migraineLogId = null,
      preventiveTreatmentId = null,
      upsertPreferred = false,
    } = input;

    const questionCache = new Map<string, Question>();
    const domainResponses: UserResponse[] = [];
    const entities: DeepPartial<UserResponseEntity>[] = [];

    for (const item of items) {
      const question = await this.loadQuestion(item.questionId, questionCache);
      const resolved = await this.resolveAnswer(
        question,
        item.answerId,
        item.answerText,
        item.answerLanguageCode,
      );
      const response = this.buildUserResponse(
        userId,
        question,
        resolved,
        migraineLogId,
        preventiveTreatmentId,
      );
      domainResponses.push(response);
      entities.push(this.mapUserResponseToEntity(response));
      if (upsertPreferred) {
        await this.upsertPreferredAnswerIfAbsent(userId, question.id as string, resolved);
      }
    }

    const persisted = await this.userResponseRepository.bulkCreate(entities);
    persisted.forEach((entity, index) => domainResponses[index].assignId(entity.id));
    return domainResponses;
  }

  /**
   * Fija `resolved` como respuesta preferida del usuario para `questionId` si
   * todavía no tiene una. Requiere que el caso de uso haya inyectado un
   * `preferredAnswersRepository`.
   */
  protected async upsertPreferredAnswerIfAbsent(
    userId: string,
    questionId: string,
    resolved: ResolvedAnswer,
  ): Promise<void> {
    if (this.preferredAnswersRepository === undefined) {
      throw new Error('preferredAnswersRepository is required to upsert preferred answers');
    }
    const existing = await this.preferredAnswersRepository.findOneBy({
      user: { id: userId },
      question: { id: questionId },
    });
    if (existing !== null) {
      return;
    }
    await this.preferredAnswersRepository.create({
      user: { id: userId },
      question: { id: questionId },
      selection: resolved.selectionId !== null ? { id: resolved.selectionId } : undefined,
      answerText: resolved.answerText,
    });
  }

  private async createCustomSelection(
    question: Question,
    text: string,
    answerLanguageCode: string | undefined,
  ): Promise<string> {
    if (answerLanguageCode === undefined) {
      throw new DomainError('answerLanguageCode is required for custom answers');
    }
    const languageCode = requireSupportedLanguage(answerLanguageCode, SUPPORTED_LANGUAGES);

    const order = await this.nextSelectionOrder(question.id as string);
    const selection = Selection.createNewSelection({
      question,
      key: `other-${randomUUID()}`,
      order,
    });
    const persistedSelection = await this.selectionRepository.create(
      this.mapSelectionToEntity(selection),
    );
    selection.assignId(persistedSelection.id);

    const translation = Translation.createNewTranslation({
      selectionId: selection.id as string,
      languageCode,
      text,
    });
    await this.translationRepository.create(this.mapTranslationToEntity(translation));

    return selection.id as string;
  }

  private async nextSelectionOrder(questionId: string): Promise<number> {
    const selections = await this.selectionRepository.findAllBy({ question: { id: questionId } });
    return selections.reduce((max, selection) => Math.max(max, selection.order), -1) + 1;
  }

  private mapSelectionToEntity(selection: Selection): DeepPartial<SelectionEntity> {
    return {
      question: { id: selection.questionId },
      key: selection.key,
      order: selection.order,
    };
  }

  private mapTranslationToEntity(translation: Translation): DeepPartial<TranslationEntity> {
    return {
      selection: { id: translation.selectionId },
      languageCode: translation.languageCode,
      text: translation.text,
    };
  }
}
