import { CognitoSignUpUc } from '@/usecase/cognito-sign-up.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';

describe('CognitoSignUpUc', () => {
  const build = (): { uc: CognitoSignUpUc; userRepository: UserRepository } => {
    const userRepository = { findOneBy: jest.fn() } as unknown as UserRepository;
    return { uc: new CognitoSignUpUc(userRepository), userRepository };
  };

  it('allows sign up when the email is not registered nor a recently changed email', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(uc.execute({ email: 'new@user.com' })).resolves.toBeUndefined();
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ email: 'new@user.com' });
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ originalEmail: 'new@user.com' });
  });

  it('rejects sign up when the email is already registered', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce({ id: 'u-1' });

    await expect(uc.execute({ email: 'taken@user.com' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    });
  });

  it('rejects sign up when the email was changed away by another user less than 30 days ago', async () => {
    const { uc, userRepository } = build();
    const ninDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    (userRepository.findOneBy as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'u-1', emailChangedAt: ninDaysAgo });

    await expect(uc.execute({ email: 'old@user.com' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_CHANGE_COOLDOWN',
    });
  });

  it('allows sign up when the email change cooldown has already elapsed', async () => {
    const { uc, userRepository } = build();
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    (userRepository.findOneBy as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'u-1', emailChangedAt: fortyDaysAgo });

    await expect(uc.execute({ email: 'old@user.com' })).resolves.toBeUndefined();
  });

  it('allows sign up when a previous owner exists but never had emailChangedAt recorded', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'u-1', emailChangedAt: null });

    await expect(uc.execute({ email: 'old@user.com' })).resolves.toBeUndefined();
  });

  it('lowercases the email before checking duplicates', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await uc.execute({ email: 'Mixed@Case.com' });

    expect(userRepository.findOneBy).toHaveBeenCalledWith({ email: 'mixed@case.com' });
  });
});
