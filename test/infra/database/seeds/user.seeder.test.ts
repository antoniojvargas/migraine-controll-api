import { DataSource } from 'typeorm';
import { UserEntity } from '@/infra/database/entities';
import { UserSeeder } from '@/infra/database/seeds/user.seeder';

describe('UserSeeder', () => {
  const build = (existingEmails: string[]) => {
    const userRepository = {
      findOneBy: jest.fn(async (criteria: { email: string }) =>
        existingEmails.includes(criteria.email) ? ({ id: 'u-1', ...criteria } as UserEntity) : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn(() => userRepository),
    } as unknown as DataSource;
    return { seeder: new UserSeeder(), dataSource, userRepository };
  };

  it('seeds the dev users when the table is empty', async () => {
    const { seeder, dataSource, userRepository } = build([]);

    await seeder.run(dataSource);

    const inserted = (userRepository.save as jest.Mock).mock.calls[0][0] as Array<{
      email: string;
    }>;
    expect(inserted).toHaveLength(2);
    expect(inserted.map((row) => row.email)).toEqual([
      'dev-user-a@migraine.local',
      'dev-user-b@migraine.local',
    ]);
  });

  it('does not insert anything when dev users already exist', async () => {
    const { seeder, dataSource, userRepository } = build([
      'dev-user-a@migraine.local',
      'dev-user-b@migraine.local',
    ]);

    await seeder.run(dataSource);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
