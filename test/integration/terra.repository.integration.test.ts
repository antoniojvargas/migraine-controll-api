import { dataSource } from '@/infra/database/dataSource';
import {
  TerraHealthDataEntity,
  TerraUserEntity,
  TerraWebhookLogEntity,
  UserEntity,
} from '@/infra/database/entities';
import { TerraHealthDataRepository } from '@/infra/database/repository/terra-health-data.repository';
import { TerraUserRepository } from '@/infra/database/repository/terra-user.repository';
import { TerraWebhookLogRepository } from '@/infra/database/repository/terra-webhook-log.repository';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { initTestDb } from './helpers';

describe('Terra repositories', () => {
  let userRepository: UserRepository;
  let terraUserRepository: TerraUserRepository;
  let terraHealthDataRepository: TerraHealthDataRepository;
  let terraWebhookLogRepository: TerraWebhookLogRepository;

  beforeAll(async () => {
    await initTestDb();
    userRepository = new UserRepository(dataSource.getRepository(UserEntity));
    terraUserRepository = new TerraUserRepository(dataSource.getRepository(TerraUserEntity));
    terraHealthDataRepository = new TerraHealthDataRepository(
      dataSource.getRepository(TerraHealthDataEntity),
    );
    terraWebhookLogRepository = new TerraWebhookLogRepository(
      dataSource.getRepository(TerraWebhookLogEntity),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query('DELETE FROM terra_webhook_logs');
    await dataSource.query('DELETE FROM terra_health_data');
    await dataSource.query('DELETE FROM terra_users');
    await dataSource.query('DELETE FROM users');
  });

  describe('TerraUserRepository', () => {
    it('creates a terra user linked to an internal user and finds it by terraUserId', async () => {
      const user = await userRepository.create({ email: 'a@test.com', externalId: 'ext-a' });

      await terraUserRepository.create({
        user,
        terraUserId: 'terra-abc',
        provider: 'GARMIN',
        scopes: 'sleep,activity',
      });

      const found = await terraUserRepository.findByTerraUserId('terra-abc');

      expect(found).not.toBeNull();
      expect(found?.provider).toBe('GARMIN');
      expect(found?.active).toBe(true);
    });

    it('returns null when no terra user matches', async () => {
      const found = await terraUserRepository.findByTerraUserId('missing');

      expect(found).toBeNull();
    });
  });

  describe('TerraHealthDataRepository', () => {
    it('finds health data within a period using Between()', async () => {
      const user = await userRepository.create({ email: 'b@test.com', externalId: 'ext-b' });
      const terraUser = await terraUserRepository.create({
        user,
        terraUserId: 'terra-b',
        provider: 'OURA',
      });

      await terraHealthDataRepository.create({
        terraUser,
        dataType: 'sleep',
        periodStart: new Date('2026-08-01T00:00:00.000Z'),
        periodEnd: new Date('2026-08-01T08:00:00.000Z'),
        data: { score: 80 },
      });
      await terraHealthDataRepository.create({
        terraUser,
        dataType: 'sleep',
        periodStart: new Date('2026-08-10T00:00:00.000Z'),
        periodEnd: new Date('2026-08-10T08:00:00.000Z'),
        data: { score: 70 },
      });
      await terraHealthDataRepository.create({
        terraUser,
        dataType: 'sleep',
        periodStart: new Date('2026-08-20T00:00:00.000Z'),
        periodEnd: new Date('2026-08-20T08:00:00.000Z'),
        data: { score: 90 },
      });

      const results = await terraHealthDataRepository.findByTerraUserAndPeriod(
        terraUser.id,
        new Date('2026-08-05T00:00:00.000Z'),
        new Date('2026-08-15T00:00:00.000Z'),
      );

      expect(results).toHaveLength(1);
      expect(results[0].data).toEqual({ score: 70 });
    });

    it('returns an empty array when no records fall within the period', async () => {
      const user = await userRepository.create({ email: 'c@test.com', externalId: 'ext-c' });
      const terraUser = await terraUserRepository.create({
        user,
        terraUserId: 'terra-c',
        provider: 'FITBIT',
      });

      const results = await terraHealthDataRepository.findByTerraUserAndPeriod(
        terraUser.id,
        new Date('2026-08-05T00:00:00.000Z'),
        new Date('2026-08-15T00:00:00.000Z'),
      );

      expect(results).toEqual([]);
    });
  });

  describe('TerraWebhookLogRepository', () => {
    it('finds webhook logs received within a date range using Between()', async () => {
      await terraWebhookLogRepository.create({
        terraUserId: 'terra-x',
        eventType: 'auth',
        status: 'processed',
        receivedAt: new Date('2026-08-01T00:00:00.000Z'),
      });
      await terraWebhookLogRepository.create({
        terraUserId: 'terra-x',
        eventType: 'sleep',
        status: 'processed',
        receivedAt: new Date('2026-08-10T00:00:00.000Z'),
      });
      await terraWebhookLogRepository.create({
        terraUserId: 'terra-x',
        eventType: 'daily',
        status: 'failed',
        errorMessage: 'boom',
        receivedAt: new Date('2026-08-20T00:00:00.000Z'),
      });

      const results = await terraWebhookLogRepository.findByReceivedAtRange(
        new Date('2026-08-05T00:00:00.000Z'),
        new Date('2026-08-15T00:00:00.000Z'),
      );

      expect(results).toHaveLength(1);
      expect(results[0].eventType).toBe('sleep');
    });
  });
});
