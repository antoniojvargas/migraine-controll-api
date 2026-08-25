import { dataSource } from '@/infra/database/dataSource';
import { UserDailyVitalsEntity, UserEntity } from '@/infra/database/entities';
import { UserDailyVitalsRepository } from '@/infra/database/repository/user-daily-vitals.repository';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { initTestDb } from './helpers';

describe('UserDailyVitalsRepository', () => {
  let userRepository: UserRepository;
  let userDailyVitalsRepository: UserDailyVitalsRepository;

  beforeAll(async () => {
    await initTestDb();
    userRepository = new UserRepository(dataSource.getRepository(UserEntity));
    userDailyVitalsRepository = new UserDailyVitalsRepository(
      dataSource.getRepository(UserDailyVitalsEntity),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query('DELETE FROM user_daily_vitals');
    await dataSource.query('DELETE FROM users');
  });

  it('creates a new row when none exists for the user and date', async () => {
    const user = await userRepository.create({ email: 'vitals-a@test.com', externalId: 'ext-a' });

    await userDailyVitalsRepository.upsertByUserAndDate({
      user: { id: user.id },
      dateLocal: '2026-08-24',
      sleepDurationMinutes: 420,
      steps: 8000,
    });

    const found = await userDailyVitalsRepository.findOneBy({
      user: { id: user.id },
      dateLocal: '2026-08-24',
    });

    expect(found).not.toBeNull();
    expect(found?.sleepDurationMinutes).toBe(420);
    expect(found?.steps).toBe(8000);
  });

  it('updates the existing row instead of duplicating it for the same user and date', async () => {
    const user = await userRepository.create({ email: 'vitals-b@test.com', externalId: 'ext-b' });

    await userDailyVitalsRepository.upsertByUserAndDate({
      user: { id: user.id },
      dateLocal: '2026-08-24',
      steps: 5000,
    });
    await userDailyVitalsRepository.upsertByUserAndDate({
      user: { id: user.id },
      dateLocal: '2026-08-24',
      steps: 9000,
    });

    const rows = await userDailyVitalsRepository.findAllBy({ user: { id: user.id } });

    expect(rows).toHaveLength(1);
    expect(rows[0].steps).toBe(9000);
  });
});
