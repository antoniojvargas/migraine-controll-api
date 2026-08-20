export interface CreateProfileDto {
  userId: string;
  name: string;
  gender: string;
  birthDate: string | Date;
  language: string;
  geohash6: string;
  appVersion?: string;
  hasTakenSurvey?: boolean;
}
