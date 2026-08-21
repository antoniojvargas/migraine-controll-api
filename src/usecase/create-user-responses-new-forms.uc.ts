import { randomUUID } from 'node:crypto';
import { DeepPartial, DataSource } from 'typeorm';
import { Question } from '@/domain/question';
import { DomainError } from '@/domain/domain-error';
import { AppError } from '@/utils/app-error';
import { optionalString, requireNonEmpty } from '@/domain/validation';
import {
  NewQuestionEntity,
  NewSelectionEntity,
  NewUserResponseEntity,
} from '@/infra/database/entities';
import { NewQuestionRepository } from '@/infra/database/repository/new-question.repository';
import { NewSelectionRepository } from '@/infra/database/repository/new-selection.repository';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';
import { CreateUserResponsesInputDto } from '@/dto/create-user-responses-input.dto';
import { UserResponseOutputDto } from '@/dto/user-response-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

interface ResolvedNewAnswer {
  selectionId: string | null;
  answerText: string | null;
  isCustom: boolean;
}

export class CreateUserResponsesNewFormsUc implements UseCaseInterface<
  CreateUserResponsesInputDto,
  UserResponseOutputDto[]
> {
  constructor(private readonly dataSource: DataSource) {}

  execute = async (input: CreateUserResponsesInputDto): Promise<UserResponseOutputDto[]> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const migraineLogId = optionalString(input.migraineLogId, 'migraineLogId');
      const preventiveTreatmentId = optionalString(
        input.preventiveTreatmentId,
        'preventiveTreatmentId',
      );

      return await this.dataSource.transaction(async (manager) => {
        const userResponseRepository = new NewUserResponseRepository(
          manager.getRepository(NewUserResponseEntity),
        );
        const questionRepository = new NewQuestionRepository(
          manager.getRepository(NewQuestionEntity),
        );
        const selectionRepository = new NewSelectionRepository(
          manager.getRepository(NewSelectionEntity),
        );

        await userResponseRepository.delete({ user: { id: userId } });

        const questionCache = new Map<string, Question>();
        const questionIds: string[] = [];
        const entities: DeepPartial<NewUserResponseEntity>[] = [];

        for (const item of input.responses) {
          const question = await this.loadQuestion(
            questionRepository,
            item.questionId,
            questionCache,
          );
          const resolved = await this.resolveAnswer(
            selectionRepository,
            question,
            item.answerId,
            item.answerText,
          );
          questionIds.push(question.id as string);
          entities.push({
            user: { id: userId },
            question: { id: question.id as string },
            selection: resolved.selectionId !== null ? { id: resolved.selectionId } : undefined,
            value: resolved.isCustom ? resolved.answerText : null,
            isCustom: resolved.isCustom,
            answerText: resolved.answerText,
            migraineLog: migraineLogId !== null ? { id: migraineLogId } : undefined,
            preventiveTreatment:
              preventiveTreatmentId !== null ? { id: preventiveTreatmentId } : undefined,
          });
        }

        const persisted = await userResponseRepository.bulkCreate(entities);
        return persisted.map((entity, index) => ({
          id: entity.id,
          userId,
          questionId: questionIds[index],
          selectionId: entity.selection?.id ?? null,
          answerText: entity.answerText ?? null,
          migraineLogId: entity.migraineLog?.id ?? migraineLogId,
          preventiveTreatmentId: entity.preventiveTreatment?.id ?? preventiveTreatmentId,
        }));
      });
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private async loadQuestion(
    questionRepository: NewQuestionRepository,
    questionId: string,
    cache: Map<string, Question>,
  ): Promise<Question> {
    const id = requireNonEmpty(questionId, 'questionId');
    const cached = cache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const entity = await questionRepository.findOneBy({ id });
    if (entity === null) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
    }
    const question = Question.createNewQuestion({
      key: entity.key,
      type: entity.type,
      order: entity.order,
    });
    question.assignId(entity.id);
    cache.set(id, question);
    return question;
  }

  private async resolveAnswer(
    selectionRepository: NewSelectionRepository,
    question: Question,
    answerId: string | null | undefined,
    answerText: string | null | undefined,
  ): Promise<ResolvedNewAnswer> {
    const hasAnswerId = answerId !== undefined && answerId !== null;
    const hasAnswerText = answerText !== undefined && answerText !== null;

    if (question.type === 'text') {
      if (hasAnswerId) {
        throw new DomainError('text questions cannot have a selection');
      }
      if (!hasAnswerText) {
        throw new DomainError('text questions require an answerText');
      }
      return {
        selectionId: null,
        answerText: requireNonEmpty(answerText as string, 'answerText'),
        isCustom: false,
      };
    }

    if (hasAnswerId && hasAnswerText) {
      throw new DomainError('provide either answerId or answerText, not both');
    }
    if (hasAnswerId) {
      return {
        selectionId: requireNonEmpty(answerId as string, 'answerId'),
        answerText: null,
        isCustom: false,
      };
    }
    if (hasAnswerText) {
      const customSelection = await this.createCustomSelection(
        selectionRepository,
        question,
        answerText as string,
      );
      return {
        selectionId: customSelection,
        answerText: null,
        isCustom: true,
      };
    }
    return { selectionId: null, answerText: null, isCustom: false };
  }

  private async createCustomSelection(
    selectionRepository: NewSelectionRepository,
    question: Question,
    value: string,
  ): Promise<string> {
    const selections = await selectionRepository.findAllBy({
      question: { id: question.id as string },
    });
    const order = selections.reduce((max, selection) => Math.max(max, selection.order), -1) + 1;
    const persisted = await selectionRepository.create({
      question: { id: question.id as string },
      key: `other-${randomUUID()}`,
      order,
      value,
      isCustom: true,
    });
    return persisted.id;
  }
}
