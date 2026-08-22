export interface CognitoPostSignInInputDto {
  externalId: string;
  email: string;
  identities?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  geohash6?: string;
  language?: string;
}
