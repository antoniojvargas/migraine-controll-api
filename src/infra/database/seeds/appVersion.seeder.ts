import { DeepPartial, DataSource } from 'typeorm';
import { AppVersionEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';

interface AppVersionSeed {
  platform: string;
  version: string;
  forceUpdate?: boolean;
  announcement?: boolean;
}

const DEV_APP_VERSIONS: AppVersionSeed[] = [
  { platform: 'ios', version: '1.2.0', forceUpdate: false, announcement: true },
  { platform: 'android', version: '1.2.0', forceUpdate: false, announcement: false },
];

export class AppVersionSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(AppVersionEntity);
    const pending: DeepPartial<AppVersionEntity>[] = [];
    for (const item of DEV_APP_VERSIONS) {
      const existing = await repository.findOneBy({ platform: item.platform });
      if (existing !== null) {
        continue;
      }
      pending.push({
        platform: item.platform,
        version: item.version,
        forceUpdate: item.forceUpdate ?? false,
        announcement: item.announcement ?? false,
      });
    }
    return seedData(dataSource, AppVersionEntity, pending, 'app_versions');
  }
}
