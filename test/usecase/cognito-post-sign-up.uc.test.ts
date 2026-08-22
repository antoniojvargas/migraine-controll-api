import { CognitoPostSignUpUc } from '@/usecase/cognito-post-sign-up.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';

describe('CognitoPostSignUpUc', () => {
  const build = (): {
    uc: CognitoPostSignUpUc;
    userRepository: UserRepository;
    profileRepository: ProfileRepository;
  } => {
    const userRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as UserRepository;
    const profileRepository = { create: jest.fn() } as unknown as ProfileRepository;
    return {
      uc: new CognitoPostSignUpUc(userRepository, profileRepository),
      userRepository,
      profileRepository,
    };
  };

  it('creates a new User and Profile when the onboarding attributes are complete', async () => {
    const { uc, userRepository, profileRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    (userRepository.create as jest.Mock).mockResolvedValue({ id: 'u-1' });
    (profileRepository.create as jest.Mock).mockResolvedValue({ id: 'p-1' });

    await uc.execute({
      externalId: 'sub-1',
      email: 'new@user.com',
      name: 'Antonio',
      gender: 'm',
      birthDate: '1990-05-20',
      geohash6: '9x8q2z',
      language: 'es',
    });

    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'new@user.com',
      externalId: 'sub-1',
      originalEmail: null,
    });
    expect(profileRepository.create).toHaveBeenCalledWith({
      user: { id: 'u-1' },
      name: 'Antonio',
      gender: 'm',
      birthDate: new Date('1990-05-20'),
      language: 'es',
      geohash6: '9x8q2z',
      hasTakenSurvey: false,
    });
  });

  it('creates only the User when onboarding attributes are incomplete', async () => {
    const { uc, userRepository, profileRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    (userRepository.create as jest.Mock).mockResolvedValue({ id: 'u-1' });

    await uc.execute({ externalId: 'sub-1', email: 'new@user.com' });

    expect(userRepository.create).toHaveBeenCalled();
    expect(profileRepository.create).not.toHaveBeenCalled();
  });

  it('migrates a legacy user by linking the externalId when found by email', async () => {
    const { uc, userRepository, profileRepository } = build();
    (userRepository.findOneBy as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'legacy-1', email: 'legacy@user.com' });

    await uc.execute({ externalId: 'sub-1', email: 'legacy@user.com' });

    expect(userRepository.update).toHaveBeenCalledWith({ id: 'legacy-1' }, { externalId: 'sub-1' });
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(profileRepository.create).not.toHaveBeenCalled();
  });

  it('updates the email and records emailChangedAt when a linked user changed email', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce({
      id: 'u-1',
      email: 'old@user.com',
    });

    await uc.execute({ externalId: 'sub-1', email: 'new@user.com' });

    expect(userRepository.update).toHaveBeenCalledWith(
      { id: 'u-1' },
      { email: 'new@user.com', originalEmail: 'old@user.com', emailChangedAt: expect.any(Date) },
    );
  });

  it('does nothing when a linked user email did not change', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce({
      id: 'u-1',
      email: 'same@user.com',
    });

    await uc.execute({ externalId: 'sub-1', email: 'same@user.com' });

    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    const { uc } = build();

    await expect(uc.execute({ externalId: 'sub-1', email: 'not-an-email' })).rejects.toThrow();
  });
});
