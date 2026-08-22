import { PostAuthenticationTriggerEvent } from './types';

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

  return event;
};
