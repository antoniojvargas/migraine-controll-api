export interface ProfileOutputDto {
  id: string;
  userId: string;
  name: string;
  gender: string;
  birthDate: Date;
  language: string;
  geohash6: string;
  appVersion: string | null;
  hasTakenSurvey: boolean;
}
