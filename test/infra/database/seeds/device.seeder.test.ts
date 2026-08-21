import { DataSource } from 'typeorm';
import { DeviceEntity, ProfileEntity, UserEntity } from '@/infra/database/entities';
import { DeviceSeeder } from '@/infra/database/seeds/device.seeder';

describe('DeviceSeeder', () => {
  const build = (options: { hasDevice: boolean; hasProfile: boolean; hasUser: boolean }) => {
    const deviceRepository = {
      findOneBy: jest.fn(async () => (options.hasDevice ? ({ id: 'd-1' } as DeviceEntity) : null)),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const userRepository = {
      findOneBy: jest.fn(async () => (options.hasUser ? ({ id: 'u-a' } as UserEntity) : null)),
    };
    const profileRepository = {
      findOneBy: jest.fn(async () =>
        options.hasProfile ? ({ id: 'p-a' } as ProfileEntity) : null,
      ),
    };
    const isDevice = (entity: unknown): boolean => entity === DeviceEntity;
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn((entity: unknown) =>
        isDevice(entity)
          ? deviceRepository
          : entity === ProfileEntity
            ? profileRepository
            : userRepository,
      ),
    } as unknown as DataSource;
    return { seeder: new DeviceSeeder(), dataSource, deviceRepository };
  };

  it('seeds an active device for the dev user profile', async () => {
    const { seeder, dataSource, deviceRepository } = build({
      hasDevice: false,
      hasProfile: true,
      hasUser: true,
    });

    await seeder.run(dataSource);

    expect(deviceRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          profile: { id: 'p-a' },
          status: 'active',
          appVersion: '1.0.0',
        }),
      ]),
    );
  });

  it('skips seeding when the dev profile already has a device', async () => {
    const { seeder, dataSource, deviceRepository } = build({
      hasDevice: true,
      hasProfile: true,
      hasUser: true,
    });

    await seeder.run(dataSource);

    expect(deviceRepository.save).not.toHaveBeenCalled();
  });

  it('throws when the profile does not exist', async () => {
    const { seeder, dataSource } = build({
      hasDevice: false,
      hasProfile: false,
      hasUser: true,
    });

    await expect(seeder.run(dataSource)).rejects.toThrow(
      '[seed:devices] profile for dev user not found',
    );
  });
});
