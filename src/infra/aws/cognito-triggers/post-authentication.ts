import { dataSource } from '@/infra/database/dataSource';
import { buildRepositories } from '@/factory/container';
import { CognitoPostSignUpUc } from '@/usecase/cognito-post-sign-up.uc';
import { CognitoPostSignInUc } from '@/usecase/cognito-post-sign-in.uc';
import { PostAuthenticationTriggerEvent } from './types';

async function ensureDataSourceInitialized(): Promise<void> {
  if (dataSource.isInitialized === false) {
    await dataSource.initialize();
  }
}

export const handler = async (
  event: PostAuthenticationTriggerEvent,
): Promise<PostAuthenticationTriggerEvent> => {
  console.log(
    JSON.stringify({
      msg: 'user authenticated',
      userPoolId: event.userPoolId,
      userName: event.userName,
      newDeviceUsed: event.request.newDeviceUsed ?? false,
      loggedInAt: new Date().toISOString(),
    }),
  );

  await ensureDataSourceInitialized();
  const repos = buildRepositories(dataSource);
  const { userAttributes } = event.request;

  await new CognitoPostSignInUc(new CognitoPostSignUpUc(repos.user, repos.profile)).execute({
    externalId: event.userName,
    email: userAttributes.email ?? '',
    identities: userAttributes.identities,
    name: userAttributes.name,
    gender: userAttributes.gender,
    birthDate: userAttributes.birthdate,
    geohash6: userAttributes['custom:geohash6'],
    language: userAttributes.locale,
  });

  return event;
};
