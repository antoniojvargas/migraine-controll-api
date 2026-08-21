import { DataSource } from 'typeorm';
import { ProfileEntity, UserEntity } from '@/infra/database/entities';
import { ProfileSeeder } from '@/infra/database/seeds/profile.seeder';

describe('ProfileSeeder', () => {
  const build = (existingUserIds: string[], options: { missingUserEmail?: string } = {}) => {
    const profileRepository = {
      findOneBy: jest.fn(async (criteria: { user: { id: string } }) =>
        existingUserIds.includes(criteria.user.id) ? ({ id: 'p-1' } as ProfileEntity) : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const userRepository = {
      findOneBy: jest.fn(async (criteria: { email: string }) => {
        if (criteria.email === options.missingUserEmail) {
          return null;
        }
        const ids: Record<string, string> = {
          'dev-user-a@migraine.local': 'u-a',
          'dev-user-b@migraine.local': 'u-b',
        };
        const id = ids[criteria.email];
        return id !== undefined ? ({ id, email: criteria.email } as UserEntity) : null;
      }),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn((entity: unknown) =>
        entity === ProfileEntity ? profileRepository : userRepository,
      ),
    } as unknown as DataSource;
    return { seeder: new ProfileSeeder(), dataSource, profileRepository };
  };

  it('seeds a profile per resolved user', async () => {
    const { seeder, dataSource, profileRepository } = build([]);

    await seeder.run(dataSource);

    const inserted = (profileRepository.save as jest.Mock).mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(inserted).toHaveLength(2);
    expect(inserted[0]).toMatchObject({
      user: { id: 'u-a' },
      name: 'Dev User A',
      language: 'es',
      geohash6: 'dzn6c6',
    });
    expect(inserted[1]).toMatchObject({ user: { id: 'u-b' }, name: 'Dev User B', language: 'en' });
  });

  it('skips profiles that already exist', async () => {
    const { seeder, dataSource, profileRepository } = build(['u-a', 'u-b']);

    await seeder.run(dataSource);

    expect(profileRepository.save).not.toHaveBeenCalled();
  });

  it('throws when the parent user is missing', async () => {
    const { seeder, dataSource } = build([], {
      missingUserEmail: 'dev-user-a@migraine.local',
    });

    await expect(seeder.run(dataSource)).rejects.toThrow(
      '[seed:profiles] user "dev-user-a@migraine.local" not found',
    );
  });
});
