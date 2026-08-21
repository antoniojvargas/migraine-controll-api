import { DataSource } from 'typeorm';
import { AcuteTreatmentWorseFeedbackOptionsEntity } from '@/infra/database/entities';
import { AcuteTreatmentWorseFeedbackOptionsSeeder } from '@/infra/database/seeds/acuteTreatmentWorseFeedbackOptions.seeder';

describe('AcuteTreatmentWorseFeedbackOptionsSeeder', () => {
  const build = (existingKeys: string[]) => {
    const repository = {
      findOneBy: jest.fn(async (criteria: { key: string }) =>
        existingKeys.includes(criteria.key)
          ? ({ id: 'o-1', ...criteria } as AcuteTreatmentWorseFeedbackOptionsEntity)
          : null,
      ),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const dataSource = {
      isInitialized: true,
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as DataSource;
    return { seeder: new AcuteTreatmentWorseFeedbackOptionsSeeder(), dataSource, repository };
  };

  it('seeds the feedback options with key and text', async () => {
    const { seeder, dataSource, repository } = build([]);

    await seeder.run(dataSource);

    expect(repository.create).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ key: 'worse_right_after', text: expect.any(String) }),
        expect.objectContaining({ key: 'no_change', text: expect.any(String) }),
        expect.objectContaining({ key: 'side_effects', text: expect.any(String) }),
      ]),
    );
  });

  it('does not insert anything when all options already exist', async () => {
    const { seeder, dataSource, repository } = build([
      'worse_right_after',
      'no_change',
      'side_effects',
    ]);

    await seeder.run(dataSource);

    expect(repository.save).not.toHaveBeenCalled();
  });
});
