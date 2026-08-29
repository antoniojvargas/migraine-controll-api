import { dataSource } from '@/infra/database/dataSource';
import { buildRepositories } from '@/factory/container';
import { CognitoSignUpUc } from '@/usecase/cognito-sign-up.uc';
import { PreSignUpTriggerEvent } from './types';

const BLOCKED_EMAIL_DOMAINS = new Set(['mailinator.com', 'tempmail.com']);

async function ensureDataSourceInitialized(): Promise<void> {
  if (dataSource.isInitialized === false) {
    await dataSource.initialize();
  }
}

export const handler = async (event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> => {
  const email = event.request.userAttributes.email ?? '';
  const domain = email.split('@')[1]?.toLowerCase();

  if (domain !== undefined && BLOCKED_EMAIL_DOMAINS.has(domain)) {
    throw new Error('Este dominio de correo no está permitido para el registro');
  }

  await ensureDataSourceInitialized();
  const repos = buildRepositories(dataSource);
  await new CognitoSignUpUc(repos.user).execute({ email });

  const isAdminCreatedUser = event.triggerSource === 'PreSignUp_AdminCreateUser';
  event.response.autoConfirmUser = isAdminCreatedUser;
  event.response.autoVerifyEmail = isAdminCreatedUser;
  event.response.autoVerifyPhone = false;

  return event;
};
