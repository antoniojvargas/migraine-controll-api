import { FormQuestionDto, FormSelectionDto } from '@/dto/form-questionary-output.dto';
import { QuestionEntity, SelectionEntity, UserResponseEntity } from '@/infra/database/entities';

export function buildFormQuestionary(
  questions: QuestionEntity[],
  selections: SelectionEntity[],
  responses: UserResponseEntity[],
): FormQuestionDto[] {
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

  const selectionsByQuestionId = new Map<string, FormSelectionDto[]>();
  for (const selection of selections) {
    const list = selectionsByQuestionId.get(selection.question.id) ?? [];
    list.push({
      id: selection.id,
      key: selection.key,
      order: selection.order,
      isSelected: selectedSelectionIds.has(selection.id),
      translations: (selection.translations ?? []).map((translation) => ({
        languageCode: translation.languageCode,
        text: translation.text,
      })),
    });
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
}
