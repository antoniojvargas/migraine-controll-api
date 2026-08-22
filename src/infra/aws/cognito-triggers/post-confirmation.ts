import { dataSource } from '@/infra/database/dataSource';
import { ProfileEntity, UserEntity } from '@/infra/database/entities';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
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

  console.log(
    JSON.stringify({
      msg: 'user confirmed sign up',
      userPoolId: event.userPoolId,
      userName: event.userName,
      email: event.request.userAttributes.email,
    }),
  );

  await ensureDataSourceInitialized();
  const userRepository = new UserRepository(dataSource.getRepository(UserEntity));
  const profileRepository = new ProfileRepository(dataSource.getRepository(ProfileEntity));
  const { userAttributes } = event.request;

  await new CognitoPostSignUpUc(userRepository, profileRepository).execute({
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
