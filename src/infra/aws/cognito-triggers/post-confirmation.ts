import { PostConfirmationTriggerEvent } from './types';

export const handler = async (
  event: PostConfirmationTriggerEvent,
): Promise<PostConfirmationTriggerEvent> => {
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    console.log(
      JSON.stringify({
        msg: 'user confirmed sign up',
        userPoolId: event.userPoolId,
        userName: event.userName,
        email: event.request.userAttributes.email,
      }),
    );
  }

  return event;
};
