export interface UpdateCognitoUserAttributesInput {
  externalId: string;
  attributes: Record<string, string>;
}

export interface CognitoIdentityProviderPort {
  updateUserAttributes(input: UpdateCognitoUserAttributesInput): Promise<void>;
}
