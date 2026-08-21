export interface FormTranslationDto {
  languageCode: string;
  text: string;
}

export interface FormSelectionDto {
  id: string;
  key: string;
  order: number;
  isSelected: boolean;
  translations: FormTranslationDto[];
}

export interface FormQuestionDto {
  id: string;
  key: string;
  type: string;
  order: number;
  value: string | null;
  selections: FormSelectionDto[];
}
