export interface CognitoTriggerEvent<TRequest, TResponse> {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  triggerSource: string;
  request: TRequest;
  response: TResponse;
}

export interface CognitoUserAttributes {
  email?: string;
  email_verified?: string;
  sub?: string;
  [key: string]: string | undefined;
}

export interface PreSignUpRequest {
  userAttributes: CognitoUserAttributes;
  validationData: Record<string, string> | null;
}

export interface PreSignUpResponse {
  autoConfirmUser: boolean;
  autoVerifyEmail: boolean;
  autoVerifyPhone: boolean;
}

export type PreSignUpTriggerEvent = CognitoTriggerEvent<PreSignUpRequest, PreSignUpResponse>;

export interface PostConfirmationRequest {
  userAttributes: CognitoUserAttributes;
}

export type PostConfirmationTriggerEvent = CognitoTriggerEvent<
  PostConfirmationRequest,
  Record<string, never>
>;

export interface PostAuthenticationRequest {
  userAttributes: CognitoUserAttributes;
  newDeviceUsed?: boolean;
}

export type PostAuthenticationTriggerEvent = CognitoTriggerEvent<
  PostAuthenticationRequest,
  Record<string, never>
>;
