export const QUESTION_TYPES = ['single', 'multiple', 'scale', 'text'] as const;

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export const MAX_TRANSLATION_TEXT_LENGTH = 200;

export const MAX_ANSWER_TEXT_LENGTH = 1000;

export const SESSION_DURATION_MIN = 0;
export const SESSION_DURATION_MAX = 90;
export const INTENSITY_MIN = 0;
export const INTENSITY_MAX = 100;
export const BATTERY_LEVEL_MIN = 0;
export const BATTERY_LEVEL_MAX = 100;
export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;
export const TREATMENT_NAME_MAX_LENGTH = 100;

export interface ProgramLimits {
  durationMax: number;
  intensityMax: number;
}

export const PROGRAM_LIMITS: Record<string, ProgramLimits> = {
  p1: { durationMax: 60, intensityMax: 70 },
  p2: { durationMax: 45, intensityMax: 50 },
  p3: { durationMax: 30, intensityMax: 30 },
};

export const PROGRAMS = Object.keys(PROGRAM_LIMITS);
