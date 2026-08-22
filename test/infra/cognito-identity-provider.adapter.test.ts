import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityProviderAdapter } from '@/infra/aws/cognito-identity-provider.adapter';

const notFound = (): UserNotFoundException =>
  new UserNotFoundException({ message: 'not found', $metadata: {} });

describe('CognitoIdentityProviderAdapter', () => {
  const build = (
    legacyPoolId?: string,
  ): { adapter: CognitoIdentityProviderAdapter; send: jest.Mock } => {
    const send = jest.fn();
    const client = { send } as unknown as CognitoIdentityProviderClient;
    const adapter = new CognitoIdentityProviderAdapter(client, 'pool-current', legacyPoolId);
    return { adapter, send };
  };

  it('updates the user attributes in the current pool', async () => {
    const { adapter, send } = build('pool-legacy');
    send.mockResolvedValueOnce({});

    await adapter.updateUserAttributes({
      externalId: 'sub-1',
      attributes: { name: 'Antonio', gender: 'm' },
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(AdminUpdateUserAttributesCommand);
    expect(send.mock.calls[0][0].input).toEqual({
      UserPoolId: 'pool-current',
      Username: 'sub-1',
      UserAttributes: [
        { Name: 'name', Value: 'Antonio' },
        { Name: 'gender', Value: 'm' },
      ],
    });
  });

  it('falls back to the legacy pool when the user is not found in the current pool', async () => {
    const { adapter, send } = build('pool-legacy');
    send.mockRejectedValueOnce(notFound());
    send.mockResolvedValueOnce({});

    await adapter.updateUserAttributes({
      externalId: 'sub-1',
      attributes: { name: 'Antonio' },
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].input).toMatchObject({
      UserPoolId: 'pool-legacy',
      Username: 'sub-1',
    });
  });

  it('rejects when the user is not found and there is no legacy pool', async () => {
    const { adapter, send } = build();
    send.mockRejectedValueOnce(notFound());

    await expect(
      adapter.updateUserAttributes({ externalId: 'sub-1', attributes: { name: 'Antonio' } }),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('rejects with the original error when it is not a UserNotFoundException', async () => {
    const { adapter, send } = build('pool-legacy');
    const error = new Error('throttled');
    send.mockRejectedValueOnce(error);

    await expect(
      adapter.updateUserAttributes({ externalId: 'sub-1', attributes: { name: 'Antonio' } }),
    ).rejects.toThrow('throttled');
    expect(send).toHaveBeenCalledTimes(1);
  });
});
