import { UpdateProfileUc } from '@/usecase/update-profile.uc';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { CognitoUpdateUserAttributesUc } from '@/usecase/cognito-update-user-attributes.uc';
import { createQueryBuilderMock } from './helpers';

const pastDate = (): Date => new Date('1990-05-20T00:00:00.000Z');

const existingEntity = {
  id: 'p-1',
  user: { id: 'u-1', externalId: 'sub-1' },
  name: 'Antonio',
  gender: 'm',
  birthDate: pastDate(),
  language: 'es',
  geohash6: '9x8q2z',
  appVersion: '1.0.0',
  hasTakenSurvey: false,
};

describe('UpdateProfileUc', () => {
  const build = (): {
    uc: UpdateProfileUc;
    profileRepository: ProfileRepository;
    cognitoUpdateUserAttributesUc: CognitoUpdateUserAttributesUc;
  } => {
    const profileRepository = {
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    } as unknown as ProfileRepository;
    const cognitoUpdateUserAttributesUc = {
      execute: jest.fn(),
    } as unknown as CognitoUpdateUserAttributesUc;
    return {
      uc: new UpdateProfileUc(profileRepository, cognitoUpdateUserAttributesUc),
      profileRepository,
      cognitoUpdateUserAttributesUc,
    };
  };

  it('updates the profile fields and syncs the changed attributes to Cognito', async () => {
    const { uc, profileRepository, cognitoUpdateUserAttributesUc } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: existingEntity }),
    );

    const result = await uc.execute({ userId: 'u-1', name: 'Ana', gender: 'f' });

    expect(result).toMatchObject({ id: 'p-1', userId: 'u-1', name: 'Ana', gender: 'f' });
    expect(profileRepository.update).toHaveBeenCalledWith(
      { id: 'p-1' },
      expect.objectContaining({ name: 'Ana', gender: 'f' }),
    );
    expect(cognitoUpdateUserAttributesUc.execute).toHaveBeenCalledWith({
      externalId: 'sub-1',
      name: 'Ana',
      gender: 'f',
      birthDate: undefined,
    });
  });

  it('syncs birthDate to Cognito in ISO date format when it changes', async () => {
    const { uc, profileRepository, cognitoUpdateUserAttributesUc } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: existingEntity }),
    );

    await uc.execute({ userId: 'u-1', birthDate: new Date('1985-03-15T00:00:00.000Z') });

    expect(cognitoUpdateUserAttributesUc.execute).toHaveBeenCalledWith({
      externalId: 'sub-1',
      name: undefined,
      gender: undefined,
      birthDate: '1985-03-15',
    });
  });

  it('does not sync to Cognito when only non-synced fields change', async () => {
    const { uc, profileRepository, cognitoUpdateUserAttributesUc } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: existingEntity }),
    );

    await uc.execute({ userId: 'u-1', language: 'en' });

    expect(cognitoUpdateUserAttributesUc.execute).toHaveBeenCalledWith({
      externalId: 'sub-1',
      name: undefined,
      gender: undefined,
      birthDate: undefined,
    });
  });

  it('rejects with 404 when the profile does not exist', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: null }),
    );

    await expect(uc.execute({ userId: 'u-1', name: 'Ana' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'PROFILE_NOT_FOUND',
    });
  });

  it('rejects an invalid gender with 400', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: existingEntity }),
    );

    await expect(uc.execute({ userId: 'u-1', gender: 'invalid' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
