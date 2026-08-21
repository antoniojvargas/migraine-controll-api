export interface OnboardingTranslationDto {
  languageCode: string;
  text: string;
}

export interface OnboardingSelectionDto {
  id: string;
  key: string;
  order: number;
  value: string | null;
  isCustom: boolean;
  isSelected: boolean;
  translations: OnboardingTranslationDto[];
}

export interface OnboardingQuestionDto {
  id: string;
  key: string;
  type: string;
  order: number;
  value: string | null;
  selections: OnboardingSelectionDto[];
}
