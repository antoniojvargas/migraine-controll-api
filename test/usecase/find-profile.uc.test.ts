import { FindProfileUc } from '@/usecase/find-profile.uc';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { createQueryBuilderMock } from './helpers';

const existing = {
  id: 'p-1',
  user: { id: 'u-1' },
  name: 'Antonio',
  gender: 'm',
  birthDate: new Date('1990-05-20T00:00:00.000Z'),
  language: 'es',
  geohash6: '9x8q2z',
  appVersion: '1.0.0',
  hasTakenSurvey: false,
};

describe('FindProfileUc', () => {
  const build = (): { uc: FindProfileUc; profileRepository: ProfileRepository } => {
    const profileRepository = { createQueryBuilder: jest.fn() } as unknown as ProfileRepository;
    return { uc: new FindProfileUc(profileRepository), profileRepository };
  };

  it('finds a profile by id', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: existing }),
    );

    const result = await uc.execute({ id: 'p-1' });

    expect(result).toMatchObject({ id: 'p-1', userId: 'u-1', name: 'Antonio' });
  });

  it('finds a profile by userId', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: existing }),
    );

    const result = await uc.execute({ userId: 'u-1' });

    expect(result).toMatchObject({ id: 'p-1', userId: 'u-1' });
  });

  it('returns null when the profile does not exist', async () => {
    const { uc, profileRepository } = build();
    (profileRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getOne: null }),
    );

    const result = await uc.execute({ userId: 'u-1' });

    expect(result).toBeNull();
  });

  it('requires exactly one of id or userId', async () => {
    const { uc } = build();

    await expect(uc.execute({ id: 'p-1', userId: 'u-1' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
    await expect(uc.execute({})).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
