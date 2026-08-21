import { DeepPartial, DataSource } from 'typeorm';
import { DeviceEntity, ProfileEntity, UserEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';

const DEV_USER_EMAIL = 'dev-user-a@migraine.local';

export class DeviceSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(DeviceEntity);
    const userRepository = dataSource.getRepository(UserEntity);
    const profileRepository = dataSource.getRepository(ProfileEntity);

    const user = await userRepository.findOneBy({ email: DEV_USER_EMAIL });
    if (user === null) {
      throw new Error(`[seed:devices] user "${DEV_USER_EMAIL}" not found (run UserSeeder first)`);
    }
    const profile = await profileRepository.findOneBy({ user: { id: user.id } });
    if (profile === null) {
      throw new Error('[seed:devices] profile for dev user not found (run ProfileSeeder first)');
    }
    const existing = await repository.findOneBy({ profile: { id: profile.id } });
    if (existing !== null) {
      return [];
    }

    const pending: DeepPartial<DeviceEntity>[] = [
      {
        profile: { id: profile.id },
        status: 'active',
        appVersion: '1.0.0',
        phoneManufacturer: 'Apple',
        phoneOsName: 'iOS',
        phoneOsVersion: '17.0',
      },
    ];
    return seedData(dataSource, DeviceEntity, pending, 'devices');
  }
}
