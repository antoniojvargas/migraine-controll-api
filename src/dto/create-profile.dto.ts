export interface CreateProfileDto {
  userId: string;
  name: string;
  gender: string;
  birthDate: string | Date;
  language: string;
  geohash6?: string;
  latitude?: number;
  longitude?: number;
  appVersion?: string;
  hasTakenSurvey?: boolean;
}
