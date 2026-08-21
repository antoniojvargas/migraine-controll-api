import { DeepPartial, DataSource } from 'typeorm';
import { AcuteTreatmentWorseFeedbackOptionsEntity } from '@/infra/database/entities';
import { BaseSeeder, seedData } from './utils/baseSeeder';

interface FeedbackOptionSeed {
  key: string;
  text: string;
}

const DEV_FEEDBACK_OPTIONS: FeedbackOptionSeed[] = [
  { key: 'worse_right_after', text: 'It got worse right after taking it' },
  { key: 'no_change', text: 'No change at all' },
  { key: 'side_effects', text: 'Side effects made it worse' },
];

export class AcuteTreatmentWorseFeedbackOptionsSeeder extends BaseSeeder {
  async run(dataSource: DataSource): Promise<unknown> {
    const repository = dataSource.getRepository(AcuteTreatmentWorseFeedbackOptionsEntity);
    const pending: DeepPartial<AcuteTreatmentWorseFeedbackOptionsEntity>[] = [];
    for (const item of DEV_FEEDBACK_OPTIONS) {
      const existing = await repository.findOneBy({ key: item.key });
      if (existing !== null) {
        continue;
      }
      pending.push({ key: item.key, text: item.text });
    }
    return seedData(
      dataSource,
      AcuteTreatmentWorseFeedbackOptionsEntity,
      pending,
      'acute_treatment_worse_feedback_options',
    );
  }
}
