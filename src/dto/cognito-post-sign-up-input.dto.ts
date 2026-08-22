export interface CognitoPostSignUpInputDto {
  externalId: string;
  email: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  geohash6?: string;
  language?: string;
}
