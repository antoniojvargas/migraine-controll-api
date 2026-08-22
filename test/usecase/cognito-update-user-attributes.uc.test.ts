import { CognitoUpdateUserAttributesUc } from '@/usecase/cognito-update-user-attributes.uc';
import { CognitoIdentityProviderPort } from '@/usecase/ports/cognito-identity-provider.port';

describe('CognitoUpdateUserAttributesUc', () => {
  const build = (): {
    uc: CognitoUpdateUserAttributesUc;
    cognitoIdentityProvider: CognitoIdentityProviderPort;
  } => {
    const cognitoIdentityProvider = {
      updateUserAttributes: jest.fn(),
    } as unknown as CognitoIdentityProviderPort;
    return {
      uc: new CognitoUpdateUserAttributesUc(cognitoIdentityProvider),
      cognitoIdentityProvider,
    };
  };

  it('syncs name, gender and birthDate to Cognito as user attributes', async () => {
    const { uc, cognitoIdentityProvider } = build();

    await uc.execute({
      externalId: 'sub-1',
      name: 'Antonio',
      gender: 'm',
      birthDate: '1990-05-20',
    });

    expect(cognitoIdentityProvider.updateUserAttributes).toHaveBeenCalledWith({
      externalId: 'sub-1',
      attributes: { name: 'Antonio', gender: 'm', birthdate: '1990-05-20' },
    });
  });

  it('only syncs the attributes provided', async () => {
    const { uc, cognitoIdentityProvider } = build();

    await uc.execute({ externalId: 'sub-1', name: 'Antonio' });

    expect(cognitoIdentityProvider.updateUserAttributes).toHaveBeenCalledWith({
      externalId: 'sub-1',
      attributes: { name: 'Antonio' },
    });
  });

  it('does nothing when no attribute is provided', async () => {
    const { uc, cognitoIdentityProvider } = build();

    await uc.execute({ externalId: 'sub-1' });

    expect(cognitoIdentityProvider.updateUserAttributes).not.toHaveBeenCalled();
  });

  it('rejects when externalId is empty', async () => {
    const { uc } = build();

    await expect(uc.execute({ externalId: '', name: 'Antonio' })).rejects.toThrow();
  });
});
