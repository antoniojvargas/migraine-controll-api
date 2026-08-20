import { dataSource } from '@/infra/database/dataSource';
import { ProfileEntity, UserEntity } from '@/infra/database/entities';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { initTestDb } from './helpers';

describe('ProfileRepository', () => {
  let repository: ProfileRepository;

  beforeAll(async () => {
    await initTestDb();
    repository = new ProfileRepository(dataSource.getRepository(ProfileEntity));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  async function createUser(email: string, externalId: string): Promise<UserEntity> {
    return dataSource.getRepository(UserEntity).save({ email, externalId });
  }

  it('creates a profile', async () => {
    const user = await createUser('p-a@test.com', 'p-ext-a');

    const profile = await repository.create({
      user,
      name: 'Ana',
      gender: 'f',
      birthDate: new Date('1990-05-10'),
      language: 'es',
      geohash6: 'dzn6c6',
      appVersion: '1.0.0',
      hasTakenSurvey: false,
    });

    expect(profile.id).toBeDefined();
    expect(profile.name).toBe('Ana');
    expect(profile.hasTakenSurvey).toBe(false);
  });

  it('finds a profile by relation criteria', async () => {
    const user = await createUser('p-b@test.com', 'p-ext-b');
    await repository.create({
      user,
      name: 'Luis',
      gender: 'm',
      birthDate: new Date('1988-01-01'),
      language: 'es',
      geohash6: 'dzn6c6',
      appVersion: '1.0.0',
      hasTakenSurvey: true,
    });

    const profile = await repository.findOneBy({ user: { id: user.id } });

    expect(profile).not.toBeNull();
    expect(profile?.name).toBe('Luis');
  });

  it('returns null when no profile matches', async () => {
    const profile = await repository.findOneBy({ name: 'NoExiste' });

    expect(profile).toBeNull();
  });

  it('finds all profiles by criteria', async () => {
    const user1 = await createUser('p-c1@test.com', 'p-ext-c1');
    const user2 = await createUser('p-c2@test.com', 'p-ext-c2');
    await repository.create({
      user: user1,
      name: 'Carla',
      gender: 'f',
      birthDate: new Date('1992-01-01'),
      language: 'es',
      geohash6: 'dzn6c6',
      appVersion: '1.0.0',
      hasTakenSurvey: false,
    });
    await repository.create({
      user: user2,
      name: 'Diana',
      gender: 'f',
      birthDate: new Date('1993-01-01'),
      language: 'es',
      geohash6: 'dzn6c6',
      appVersion: '1.0.0',
      hasTakenSurvey: false,
    });

    const profiles = await repository.findAllBy({ gender: 'f' });

    expect(profiles.length).toBeGreaterThanOrEqual(2);
  });
});
