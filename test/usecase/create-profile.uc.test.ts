import { CreateProfileUc } from '@/usecase/create-profile.uc';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { encodeGeohash6 } from '@/utils/geohash';
import { createQueryBuilderMock } from './helpers';

const pastDate = (): Date => new Date('1990-05-20T00:00:00.000Z');

const baseInput = {
  userId: 'u-1',
  name: 'Antonio',
  gender: 'm',
  birthDate: pastDate(),
  language: 'es',
  geohash6: '9x8q2z',
  appVersion: '1.0.0',
};

describe('CreateProfileUc', () => {
  const build = (): { uc: CreateProfileUc; profileRepository: ProfileRepository } => {
    const profileRepository = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
    } as unknown as ProfileRepository;
    return { uc: new CreateProfileUc(profileRepository), profileRepository };
  };

  it('creates a profile when none exists', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: null }),
    );
    (profileRepository.create as jest.Mock).mockResolvedValue({ id: 'p-1' });

    const result = await uc.execute(baseInput);

    expect(result).toEqual({
      id: 'p-1',
      userId: 'u-1',
      name: 'Antonio',
      gender: 'm',
      birthDate: pastDate(),
      language: 'es',
      geohash6: '9x8q2z',
      appVersion: '1.0.0',
      hasTakenSurvey: false,
    });
    expect(profileRepository.create).toHaveBeenCalledWith({
      user: { id: 'u-1' },
      name: 'Antonio',
      gender: 'm',
      birthDate: pastDate(),
      language: 'es',
      geohash6: '9x8q2z',
      appVersion: '1.0.0',
      hasTakenSurvey: false,
    });
  });

  it('returns the existing profile without creating (idempotent)', async () => {
    const { uc, profileRepository } = build();
    const existing = {
      id: 'p-1',
      user: { id: 'u-1' },
      name: 'Antonio',
      gender: 'm',
      birthDate: pastDate(),
      language: 'es',
      geohash6: '9x8q2z',
      appVersion: '1.0.0',
      hasTakenSurvey: true,
    };
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: existing }),
    );

    const result = await uc.execute(baseInput);

    expect(result).toMatchObject({ id: 'p-1', userId: 'u-1', hasTakenSurvey: true });
    expect(profileRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid geohash with 400', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: null }),
    );

    await expect(uc.execute({ ...baseInput, geohash6: 'nope' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });

  it('computes geohash6 from latitude/longitude when geohash6 is not provided', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: null }),
    );
    (profileRepository.create as jest.Mock).mockResolvedValue({ id: 'p-1' });
    const expectedGeohash6 = encodeGeohash6(57.64911, 10.40744);

    const result = await uc.execute({
      ...baseInput,
      geohash6: undefined,
      latitude: 57.64911,
      longitude: 10.40744,
    });

    expect(result.geohash6).toBe(expectedGeohash6);
    expect(profileRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ geohash6: expectedGeohash6 }),
    );
  });

  it('rejects with 400 when neither geohash6 nor latitude/longitude are provided', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: null }),
    );
    await expect(uc.execute({ ...baseInput, geohash6: undefined })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
      message: 'geohash6 or latitude/longitude are required',
    });
  });
});
