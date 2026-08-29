import { dataSource } from '@/infra/database/dataSource';
import { buildRepositories } from '@/factory/container';
import { logger } from '@/config/logger';
import { CognitoPostSignUpUc } from '@/usecase/cognito-post-sign-up.uc';
import { PostConfirmationTriggerEvent } from './types';

async function ensureDataSourceInitialized(): Promise<void> {
  if (dataSource.isInitialized === false) {
    await dataSource.initialize();
  }
}

export const handler = async (
  event: PostConfirmationTriggerEvent,
): Promise<PostConfirmationTriggerEvent> => {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return event;
  }

  logger.info(
    {
      userPoolId: event.userPoolId,
      userName: event.userName,
      email: event.request.userAttributes.email,
    },
    'user confirmed sign up',
  );

  await ensureDataSourceInitialized();
  const repos = buildRepositories(dataSource);
  const { userAttributes } = event.request;

  await new CognitoPostSignUpUc(repos.user, repos.profile).execute({
    externalId: event.userName,
    email: userAttributes.email ?? '',
    name: userAttributes.name,
    gender: userAttributes.gender,
    birthDate: userAttributes.birthdate,
    geohash6: userAttributes['custom:geohash6'],
    language: userAttributes.locale,
  });

  return event;
};
