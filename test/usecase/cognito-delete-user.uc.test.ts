import { CognitoDeleteUserUc } from '@/usecase/cognito-delete-user.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { CognitoUserDirectoryPort } from '@/usecase/ports/cognito-user-directory.port';

const entity = { id: 'u-1', email: 'user@b.com', externalId: 'sub-1', originalEmail: null };

describe('CognitoDeleteUserUc', () => {
  const build = (): {
    uc: CognitoDeleteUserUc;
    userRepository: UserRepository;
    cognitoUserDirectory: CognitoUserDirectoryPort;
  } => {
    const userRepository = {
      findOneBy: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as UserRepository;
    const cognitoUserDirectory = {
      findUserBySub: jest.fn(),
      findUserByEmail: jest.fn(),
      tombstoneUser: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as CognitoUserDirectoryPort;
    return {
      uc: new CognitoDeleteUserUc(userRepository, cognitoUserDirectory),
      userRepository,
      cognitoUserDirectory,
    };
  };

  it('resolves the Cognito user by sub and hard-deletes non-Apple users', async () => {
    const { uc, userRepository, cognitoUserDirectory } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);
    const cognitoUser = { username: 'sub-1', poolId: 'pool-1', email: 'user@b.com' };
    (cognitoUserDirectory.findUserBySub as jest.Mock).mockResolvedValue(cognitoUser);

    await uc.execute({ id: 'u-1' });

    expect(cognitoUserDirectory.findUserByEmail).not.toHaveBeenCalled();
    expect(cognitoUserDirectory.deleteUser).toHaveBeenCalledWith(cognitoUser);
    expect(cognitoUserDirectory.tombstoneUser).not.toHaveBeenCalled();
    expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'u-1' });
  });

  it('falls back to email lookup when the user is not found by sub (legacy pool support)', async () => {
    const { uc, userRepository, cognitoUserDirectory } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);
    (cognitoUserDirectory.findUserBySub as jest.Mock).mockResolvedValue(null);
    const cognitoUser = { username: 'legacy-user', poolId: 'legacy-pool', email: 'user@b.com' };
    (cognitoUserDirectory.findUserByEmail as jest.Mock).mockResolvedValue(cognitoUser);

    await uc.execute({ id: 'u-1' });

    expect(cognitoUserDirectory.findUserByEmail).toHaveBeenCalledWith('user@b.com');
    expect(cognitoUserDirectory.deleteUser).toHaveBeenCalledWith(cognitoUser);
    expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'u-1' });
  });

  it('tombstones Apple Sign-In users by mutating their email instead of deleting', async () => {
    const { uc, userRepository, cognitoUserDirectory } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);
    const cognitoUser = {
      username: 'sub-1',
      poolId: 'pool-1',
      email: 'user@privaterelay.appleid.com',
      identities: '[{"providerName":"SignInWithApple","providerType":"SignInWithApple"}]',
    };
    (cognitoUserDirectory.findUserBySub as jest.Mock).mockResolvedValue(cognitoUser);

    await uc.execute({ id: 'u-1' });

    expect(cognitoUserDirectory.tombstoneUser).toHaveBeenCalledWith(cognitoUser);
    expect(cognitoUserDirectory.deleteUser).not.toHaveBeenCalled();
    expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'u-1' });
  });

  it('soft-deletes the local user even when no Cognito user is found', async () => {
    const { uc, userRepository, cognitoUserDirectory } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);
    (cognitoUserDirectory.findUserBySub as jest.Mock).mockResolvedValue(null);
    (cognitoUserDirectory.findUserByEmail as jest.Mock).mockResolvedValue(null);

    await uc.execute({ id: 'u-1' });

    expect(cognitoUserDirectory.deleteUser).not.toHaveBeenCalled();
    expect(cognitoUserDirectory.tombstoneUser).not.toHaveBeenCalled();
    expect(userRepository.softDelete).toHaveBeenCalledWith({ id: 'u-1' });
  });

  it('throws 404 when the local user does not exist', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(uc.execute({ id: 'u-1' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('rejects when id is empty', async () => {
    const { uc } = build();

    await expect(uc.execute({ id: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
