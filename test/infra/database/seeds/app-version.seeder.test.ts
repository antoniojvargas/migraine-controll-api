import { DataSource } from 'typeorm';
import { AppVersionEntity } from '@/infra/database/entities';
import { AppVersionSeeder } from '@/infra/database/seeds/appVersion.seeder';

describe('AppVersionSeeder', () => {
  const build = (existingPlatforms: string[]) => {
    const repository = {
      findOneBy: jest.fn(async (criteria: { platform: string }) =>
        existingPlatforms.includes(criteria.platform)
          ? ({ id: 'v-1', ...criteria } as AppVersionEntity)
          : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as DataSource;
    return { seeder: new AppVersionSeeder(), dataSource, repository };
  };

  it('seeds ios and android app versions', async () => {
    const { seeder, dataSource, repository } = build([]);

    await seeder.run(dataSource);

    const inserted = (repository.save as jest.Mock).mock.calls[0][0] as Array<{
      platform: string;
      version: string;
    }>;
    expect(inserted).toEqual([
      { platform: 'ios', version: '1.2.0', forceUpdate: false, announcement: true },
      { platform: 'android', version: '1.2.0', forceUpdate: false, announcement: false },
    ]);
  });

  it('skips platforms that already exist', async () => {
    const { seeder, dataSource, repository } = build(['ios']);

    await seeder.run(dataSource);

    const inserted = (repository.save as jest.Mock).mock.calls[0][0] as unknown[];
    expect(inserted).toHaveLength(1);
  });
});
