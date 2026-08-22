import { CognitoPostSignInUc } from '@/usecase/cognito-post-sign-in.uc';
import { CognitoPostSignUpUc } from '@/usecase/cognito-post-sign-up.uc';

describe('CognitoPostSignInUc', () => {
  const build = (): { uc: CognitoPostSignInUc; cognitoPostSignUpUc: CognitoPostSignUpUc } => {
    const cognitoPostSignUpUc = { execute: jest.fn() } as unknown as CognitoPostSignUpUc;
    return { uc: new CognitoPostSignInUc(cognitoPostSignUpUc), cognitoPostSignUpUc };
  };

  it('syncs the user via CognitoPostSignUpUc when identities include SignInWithApple', async () => {
    const { uc, cognitoPostSignUpUc } = build();

    await uc.execute({
      externalId: 'sub-1',
      email: 'apple-user@privaterelay.appleid.com',
      identities: '[{"providerName":"SignInWithApple","providerType":"SignInWithApple"}]',
      name: 'Antonio',
    });

    expect(cognitoPostSignUpUc.execute).toHaveBeenCalledWith({
      externalId: 'sub-1',
      email: 'apple-user@privaterelay.appleid.com',
      name: 'Antonio',
      gender: undefined,
      birthDate: undefined,
      geohash6: undefined,
      language: undefined,
    });
  });

  it('does nothing when identities is missing (native sign-in)', async () => {
    const { uc, cognitoPostSignUpUc } = build();

    await uc.execute({ externalId: 'sub-1', email: 'user@user.com' });

    expect(cognitoPostSignUpUc.execute).not.toHaveBeenCalled();
  });

  it('does nothing when identities does not include SignInWithApple', async () => {
    const { uc, cognitoPostSignUpUc } = build();

    await uc.execute({
      externalId: 'sub-1',
      email: 'user@user.com',
      identities: '[{"providerName":"Google","providerType":"Google"}]',
    });

    expect(cognitoPostSignUpUc.execute).not.toHaveBeenCalled();
  });
});
