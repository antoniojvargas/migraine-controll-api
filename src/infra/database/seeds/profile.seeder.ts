import { DeepPartial, DataSource } from 'typeorm';
import { ProfileEntity, UserEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';

interface ProfileSeed {
  userEmail: string;
  name: string;
  gender: string;
  birthDate: string;
  language: string;
  geohash6: string;
}

const DEV_PROFILES: ProfileSeed[] = [
  {
    userEmail: 'dev-user-a@migraine.local',
    name: 'Dev User A',
    gender: 'f',
    birthDate: '1990-05-10',
    language: 'es',
    geohash6: 'dzn6c6',
  },
  {
    userEmail: 'dev-user-b@migraine.local',
    name: 'Dev User B',
    gender: 'm',
    birthDate: '1988-11-23',
    language: 'en',
    geohash6: 'dzn6c6',
  },
];

export class ProfileSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(ProfileEntity);
    const userRepository = dataSource.getRepository(UserEntity);
    const pending: DeepPartial<ProfileEntity>[] = [];

    for (const item of DEV_PROFILES) {
      const user = await this.resolveUser(userRepository, item.userEmail);
      const existing = await repository.findOneBy({ user: { id: user.id } });
      if (existing !== null) {
        continue;
      }
      pending.push({
        user: { id: user.id },
        name: item.name,
        gender: item.gender,
        birthDate: new Date(item.birthDate),
        language: item.language,
        geohash6: item.geohash6,
        hasTakenSurvey: false,
      });
    }

    return seedData(dataSource, ProfileEntity, pending, 'profiles');
  }

  private async resolveUser(
    repository: { findOneBy(criteria: { email: string }): Promise<UserEntity | null> },
    email: string,
  ): Promise<UserEntity> {
    const user = await repository.findOneBy({ email });
    if (user === null) {
      throw new Error(`[seed:profiles] user "${email}" not found (run UserSeeder first)`);
    }
    return user;
  }
}
