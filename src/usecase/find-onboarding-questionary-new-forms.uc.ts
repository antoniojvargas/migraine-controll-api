import { ONBOARDING_LANGUAGES } from '@/domain/constants';
import { requireNonEmpty } from '@/domain/validation';
import { NewQuestionRepository } from '@/infra/database/repository/new-question.repository';
import { NewSelectionRepository } from '@/infra/database/repository/new-selection.repository';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';
import { NewQuestionEntity, NewSelectionEntity } from '@/infra/database/entities';
import {
  OnboardingQuestionDto,
  OnboardingSelectionDto,
} from '@/dto/onboarding-questionary-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindOnboardingQuestionaryNewFormsUc implements UseCaseInterface<
  { userId: string },
  OnboardingQuestionDto[]
> {
  constructor(
    private readonly questionRepository: NewQuestionRepository,
    private readonly selectionRepository: NewSelectionRepository,
    private readonly userResponseRepository: NewUserResponseRepository,
  ) {}

  execute = async (input: { userId: string }): Promise<OnboardingQuestionDto[]> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');

      const questions = await this.questionRepository
        .createQueryBuilder('question')
        .orderBy('question.order', 'ASC')
        .getMany();
      if (questions.length === 0) {
        return [];
      }

      const selections = await this.loadSelections(questions);
      const responses = await this.userResponseRepository.findAllBy({ user: { id: userId } });

      const selectedSelectionIds = new Set<string>();
      const textAnswerByQuestionId = new Map<string, string>();
      for (const response of responses) {
        if (response.selection !== null && response.selection !== undefined) {
          selectedSelectionIds.add(response.selection.id);
        }
        if (response.answerText !== null && response.question !== undefined) {
          textAnswerByQuestionId.set(response.question.id, response.answerText);
        }
      }

      const selectionsByQuestionId = new Map<string, OnboardingSelectionDto[]>();
      for (const selection of selections) {
        const list = selectionsByQuestionId.get(selection.question.id) ?? [];
        list.push(this.toSelectionOutput(selection, selectedSelectionIds.has(selection.id)));
        selectionsByQuestionId.set(selection.question.id, list);
      }

      return questions.map((question) => ({
        id: question.id,
        key: question.key,
        type: question.type,
        order: question.order,
        value: textAnswerByQuestionId.get(question.id) ?? null,
        selections: selectionsByQuestionId.get(question.id) ?? [],
      }));
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private async loadSelections(questions: NewQuestionEntity[]): Promise<NewSelectionEntity[]> {
    const questionIds = questions.map((question) => question.id);
    return this.selectionRepository
      .createQueryBuilder('selection')
      .leftJoinAndSelect('selection.translations', 'translation')
      .where('selection.question_id IN (:...questionIds)', { questionIds })
      .orderBy('selection.order', 'ASC')
      .addOrderBy('translation.language_code', 'ASC')
      .getMany();
  }

  private toSelectionOutput(
    selection: NewSelectionEntity,
    isSelected: boolean,
  ): OnboardingSelectionDto {
    return {
      id: selection.id,
      key: selection.key,
      order: selection.order,
      value: selection.value ?? null,
      isCustom: selection.isCustom ?? false,
      isSelected,
      translations: (selection.translations ?? [])
        .filter((translation) =>
          (ONBOARDING_LANGUAGES as readonly string[]).includes(translation.languageCode),
        )
        .map((translation) => ({ languageCode: translation.languageCode, text: translation.text })),
    };
  }
}
