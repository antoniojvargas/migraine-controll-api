import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoUserDirectoryAdapter } from '@/infra/aws/cognito-user-directory.adapter';

describe('CognitoUserDirectoryAdapter', () => {
  const build = (
    legacyPoolId?: string,
  ): { adapter: CognitoUserDirectoryAdapter; send: jest.Mock } => {
    const send = jest.fn();
    const client = { send } as unknown as CognitoIdentityProviderClient;
    return { adapter: new CognitoUserDirectoryAdapter(client, 'pool-1', legacyPoolId), send };
  };

  describe('findUserBySub', () => {
    it('returns the user when found in the current pool', async () => {
      const { adapter, send } = build();
      send.mockResolvedValueOnce({
        Username: 'sub-1',
        UserAttributes: [{ Name: 'email', Value: 'a@b.com' }],
      });

      const result = await adapter.findUserBySub('sub-1');

      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0]).toBeInstanceOf(AdminGetUserCommand);
      expect(send.mock.calls[0][0].input).toMatchObject({
        UserPoolId: 'pool-1',
        Username: 'sub-1',
      });
      expect(result).toEqual({
        username: 'sub-1',
        poolId: 'pool-1',
        email: 'a@b.com',
        identities: undefined,
      });
    });

    it('falls back to the legacy pool when not found in the current pool', async () => {
      const { adapter, send } = build('legacy-pool');
      send
        .mockRejectedValueOnce(new UserNotFoundException({ message: 'not found', $metadata: {} }))
        .mockResolvedValueOnce({ Username: 'sub-1', UserAttributes: [] });

      const result = await adapter.findUserBySub('sub-1');

      expect(send).toHaveBeenCalledTimes(2);
      expect(send.mock.calls[1][0].input).toMatchObject({
        UserPoolId: 'legacy-pool',
        Username: 'sub-1',
      });
      expect(result).toMatchObject({ poolId: 'legacy-pool', username: 'sub-1' });
    });

    it('returns null when not found in any pool', async () => {
      const { adapter, send } = build('legacy-pool');
      send.mockRejectedValue(new UserNotFoundException({ message: 'not found', $metadata: {} }));

      const result = await adapter.findUserBySub('sub-1');

      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('queries by email filter and maps the first match', async () => {
      const { adapter, send } = build();
      send.mockResolvedValueOnce({
        Users: [{ Username: 'user-1', Attributes: [{ Name: 'email', Value: 'a@b.com' }] }],
      });

      const result = await adapter.findUserByEmail('a@b.com');

      expect(send.mock.calls[0][0]).toBeInstanceOf(ListUsersCommand);
      expect(send.mock.calls[0][0].input).toMatchObject({
        UserPoolId: 'pool-1',
        Filter: 'email = "a@b.com"',
      });
      expect(result).toEqual({
        username: 'user-1',
        poolId: 'pool-1',
        email: 'a@b.com',
        identities: undefined,
      });
    });

    it('returns null when no user matches', async () => {
      const { adapter, send } = build();
      send.mockResolvedValueOnce({ Users: [] });

      const result = await adapter.findUserByEmail('missing@b.com');

      expect(result).toBeNull();
    });
  });

  describe('tombstoneUser', () => {
    it('mutates the email attribute to a tombstone value', async () => {
      const { adapter, send } = build();

      await adapter.tombstoneUser({ username: 'user-1', poolId: 'pool-1', email: 'a@b.com' });

      expect(send.mock.calls[0][0]).toBeInstanceOf(AdminUpdateUserAttributesCommand);
      const input = send.mock.calls[0][0].input;
      expect(input.UserPoolId).toBe('pool-1');
      expect(input.Username).toBe('user-1');
      expect(input.UserAttributes).toContainEqual(
        expect.objectContaining({ Name: 'email', Value: expect.stringContaining('@tombstoned.') }),
      );
    });
  });

  describe('deleteUser', () => {
    it('sends AdminDeleteUserCommand', async () => {
      const { adapter, send } = build();

      await adapter.deleteUser({ username: 'user-1', poolId: 'pool-1', email: 'a@b.com' });

      expect(send.mock.calls[0][0]).toBeInstanceOf(AdminDeleteUserCommand);
      expect(send.mock.calls[0][0].input).toMatchObject({
        UserPoolId: 'pool-1',
        Username: 'user-1',
      });
    });
  });
});
