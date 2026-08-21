import { DeepPartial, DataSource } from 'typeorm';
import { UserEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';

interface UserSeed {
  email: string;
  externalId: string;
}

const DEV_USERS: UserSeed[] = [
  { email: 'dev-user-a@migraine.local', externalId: 'ext-dev-a' },
  { email: 'dev-user-b@migraine.local', externalId: 'ext-dev-b' },
];

export class UserSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(UserEntity);
    const pending: DeepPartial<UserEntity>[] = [];
    for (const item of DEV_USERS) {
      const existing = await repository.findOneBy({ email: item.email });
      if (existing !== null) {
        continue;
      }
      pending.push({ email: item.email, externalId: item.externalId });
    }
    return seedData(dataSource, UserEntity, pending, 'users');
  }
}
