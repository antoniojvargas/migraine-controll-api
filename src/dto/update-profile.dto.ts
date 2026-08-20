export interface UpdateProfileDto {
  name?: string;
  gender?: string;
  birthDate?: string | Date;
  language?: string;
  geohash6?: string;
  appVersion?: string | null;
  hasTakenSurvey?: boolean;
}
