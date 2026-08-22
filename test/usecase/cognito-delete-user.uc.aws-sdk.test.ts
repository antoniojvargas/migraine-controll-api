import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoDeleteUserUc } from '@/usecase/cognito-delete-user.uc';
import { CognitoUserDirectoryAdapter } from '@/infra/aws/cognito-user-directory.adapter';
import { UserRepository } from '@/infra/database/repository/user.repository';

const CURRENT_POOL_ID = 'pool-current';
const LEGACY_POOL_ID = 'pool-legacy';

const notFound = (): UserNotFoundException =>
  new UserNotFoundException({ message: 'not found', $metadata: {} });

describe('CognitoDeleteUserUc with the real Cognito AWS SDK adapter', () => {
  const build = (): {
    uc: CognitoDeleteUserUc;
    userRepository: UserRepository;
    send: jest.Mock;
  } => {
    const send = jest.fn();
    const client = { send } as unknown as CognitoIdentityProviderClient;
    const adapter = new CognitoUserDirectoryAdapter(client, CURRENT_POOL_ID, LEGACY_POOL_ID);
    const userRepository = {
      findOneBy: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as UserRepository;
    return { uc: new CognitoDeleteUserUc(userRepository, adapter), userRepository, send };
  };

  const localUser = {
    id: 'local-1',
    email: 'user@b.com',
    externalId: 'sub-1',
    originalEmail: null,
  };

  describe('Apple Sign-In user', () => {
    it('tombstones the Cognito user by mutating the email instead of deleting it', async () => {
      const { uc, userRepository, send } = build();
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(localUser);
      send.mockResolvedValueOnce({
        Username: 'sub-1',
        UserAttributes: [
          { Name: 'email', Value: 'user@privaterelay.appleid.com' },
          {
            Name: 'identities',
            Value: '[{"providerName":"SignInWithApple","providerType":"SignInWithApple"}]',
          },
        ],
      });
      send.mockResolvedValueOnce({});

      await uc.execute({ id: 'local-1' });

      expect(send).toHaveBeenCalledTimes(2);
      expect(send.mock.calls[0][0]).toBeInstanceOf(AdminGetUserCommand);
      expect(send.mock.calls[0][0].input).toMatchObject({
        UserPoolId: CURRENT_POOL_ID,
        Username: 'sub-1',
      });
      expect(send.mock.calls[1][0]).toBeInstanceOf(AdminUpdateUserAttributesCommand);
      const tombstoneInput = send.mock.calls[1][0].input;
      expect(tombstoneInput.UserPoolId).toBe(CURRENT_POOL_ID);
      expect(tombstoneInput.Username).toBe('sub-1');
      expect(tombstoneInput.UserAttributes).toContainEqual(
        expect.objectContaining({ Name: 'email', Value: expect.stringContaining('@tombstoned.') }),
      );
      expect(send.mock.calls.some((call) => call[0] instanceof AdminDeleteUserCommand)).toBe(false);
      expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'local-1' });
    });
  });

  describe('email/password (native) user', () => {
    it('hard-deletes the Cognito user via AdminDeleteUserCommand', async () => {
      const { uc, userRepository, send } = build();
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(localUser);
      send.mockResolvedValueOnce({
        Username: 'sub-1',
        UserAttributes: [{ Name: 'email', Value: 'user@b.com' }],
      });
      send.mockResolvedValueOnce({});

      await uc.execute({ id: 'local-1' });

      expect(send).toHaveBeenCalledTimes(2);
      expect(send.mock.calls[1][0]).toBeInstanceOf(AdminDeleteUserCommand);
      expect(send.mock.calls[1][0].input).toMatchObject({
        UserPoolId: CURRENT_POOL_ID,
        Username: 'sub-1',
      });
      expect(
        send.mock.calls.some((call) => call[0] instanceof AdminUpdateUserAttributesCommand),
      ).toBe(false);
      expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'local-1' });
    });
  });

  describe('migrated user (found only in the legacy pool)', () => {
    it('falls back to the legacy pool by sub and deletes the user there', async () => {
      const { uc, userRepository, send } = build();
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(localUser);
      send
        .mockRejectedValueOnce(notFound())
        .mockResolvedValueOnce({
          Username: 'legacy-username',
          UserAttributes: [{ Name: 'email', Value: 'user@b.com' }],
        })
        .mockResolvedValueOnce({});

      await uc.execute({ id: 'local-1' });

      expect(send).toHaveBeenCalledTimes(3);
      expect(send.mock.calls[0][0].input).toMatchObject({ UserPoolId: CURRENT_POOL_ID });
      expect(send.mock.calls[1][0].input).toMatchObject({ UserPoolId: LEGACY_POOL_ID });
      expect(send.mock.calls[2][0]).toBeInstanceOf(AdminDeleteUserCommand);
      expect(send.mock.calls[2][0].input).toMatchObject({
        UserPoolId: LEGACY_POOL_ID,
        Username: 'legacy-username',
      });
      expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'local-1' });
    });

    it('falls back to an email lookup across pools when the sub is not found anywhere', async () => {
      const { uc, userRepository, send } = build();
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(localUser);
      send
        .mockRejectedValueOnce(notFound())
        .mockRejectedValueOnce(notFound())
        .mockResolvedValueOnce({ Users: [] })
        .mockResolvedValueOnce({
          Users: [
            { Username: 'legacy-username', Attributes: [{ Name: 'email', Value: 'user@b.com' }] },
          ],
        })
        .mockResolvedValueOnce({});

      await uc.execute({ id: 'local-1' });

      expect(send).toHaveBeenCalledTimes(5);
      expect(send.mock.calls[2][0]).toBeInstanceOf(ListUsersCommand);
      expect(send.mock.calls[2][0].input).toMatchObject({ UserPoolId: CURRENT_POOL_ID });
      expect(send.mock.calls[3][0]).toBeInstanceOf(ListUsersCommand);
      expect(send.mock.calls[3][0].input).toMatchObject({ UserPoolId: LEGACY_POOL_ID });
      expect(send.mock.calls[4][0]).toBeInstanceOf(AdminDeleteUserCommand);
      expect(send.mock.calls[4][0].input).toMatchObject({
        UserPoolId: LEGACY_POOL_ID,
        Username: 'legacy-username',
      });
      expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'local-1' });
    });
  });

  describe('user not present in Cognito at all', () => {
    it('still soft-deletes the local user without calling delete/tombstone', async () => {
      const { uc, userRepository, send } = build();
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(localUser);
      send.mockRejectedValueOnce(notFound());
      send.mockRejectedValueOnce(notFound());
      send.mockResolvedValueOnce({ Users: [] });
      send.mockResolvedValueOnce({ Users: [] });

      await uc.execute({ id: 'local-1' });

      expect(
        send.mock.calls.some(
          (call) =>
            call[0] instanceof AdminDeleteUserCommand ||
            call[0] instanceof AdminUpdateUserAttributesCommand,
        ),
      ).toBe(false);
      expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'local-1' });
    });
  });
});
