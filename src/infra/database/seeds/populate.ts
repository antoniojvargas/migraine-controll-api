import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { logger } from '@/config/logger';
import { dataSource } from '@/infra/database/dataSource';
import { BaseSeeder } from './utils/baseSeeder';
import { AppVersionSeeder } from './appVersion.seeder';
import { UserSeeder } from './user.seeder';
import { ProfileSeeder } from './profile.seeder';
import { DeviceSeeder } from './device.seeder';
import { AcuteTreatmentWorseFeedbackOptionsSeeder } from './acuteTreatmentWorseFeedbackOptions.seeder';
import { PreferredAnswersSeeder } from './preferredAnswers.seeder';
import { NewQuestionSeeder } from './new-question.seeder';
import { NewSelectionSeeder } from './new-selection.seeder';
import { NewTranslationSeeder } from './new-translation.seeder';

export interface SeederEntry {
  name: string;
  seeder: BaseSeeder;
  optional?: boolean;
}

export const SEEDER_ENTRIES: SeederEntry[] = [
  { name: 'app_versions', seeder: new AppVersionSeeder() },
  { name: 'users', seeder: new UserSeeder() },
  { name: 'profiles', seeder: new ProfileSeeder() },
  { name: 'devices', seeder: new DeviceSeeder() },
  {
    name: 'acute_treatment_worse_feedback_options',
    seeder: new AcuteTreatmentWorseFeedbackOptionsSeeder(),
  },
  {
    name: 'preferred_answers',
    seeder: new PreferredAnswersSeeder(),
    optional: true,
  },
  { name: 'new_questions', seeder: new NewQuestionSeeder() },
  { name: 'new_selections', seeder: new NewSelectionSeeder() },
  { name: 'new_translations', seeder: new NewTranslationSeeder() },
];

export async function runSeeders(
  dataSource: DataSource,
  entries: SeederEntry[],
  log: Pick<typeof logger, 'info' | 'warn' | 'error'> = logger,
): Promise<void> {
  for (const entry of entries) {
    try {
      await entry.seeder.run(dataSource);
      log.info(`[seed] ${entry.name}: done`);
    } catch (error) {
      if (entry.optional === true) {
        log.warn(
          `[seed] ${entry.name}: skipped (${error instanceof Error ? error.message : String(error)})`,
        );
        continue;
      }
      throw error;
    }
  }
}

async function main(): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  try {
    await runSeeders(dataSource, SEEDER_ENTRIES);
    logger.info('[seed] database populated');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, '[seed] population failed');
  process.exitCode = 1;
});
