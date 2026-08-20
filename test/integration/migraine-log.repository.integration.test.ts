import { dataSource } from '@/infra/database/dataSource';
import { MigraineLogEntity, UserEntity } from '@/infra/database/entities';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { initTestDb } from './helpers';

describe('MigraineLogRepository', () => {
  let repository: MigraineLogRepository;

  beforeAll(async () => {
    await initTestDb();
    repository = new MigraineLogRepository(dataSource.getRepository(MigraineLogEntity));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  async function createUser(email: string): Promise<UserEntity> {
    return dataSource.getRepository(UserEntity).save({ email, externalId: `ext-${email}` });
  }

  it('creates a migraine log', async () => {
    const user = await createUser('m-a@test.com');

    const log = await repository.create({
      user,
      intensity: 6,
      painLocation: 'frontal',
      startedAt: new Date('2026-08-19T10:00:00Z'),
    });

    expect(log.id).toBeDefined();
    expect(log.intensity).toBe(6);
    expect(log.painLocation).toBe('frontal');
    expect(log.startedAt).toBeInstanceOf(Date);
  });

  it('finds a log by relation criteria', async () => {
    const user = await createUser('m-b@test.com');
    await repository.create({
      user,
      intensity: 4,
      painLocation: 'temporal',
      startedAt: new Date('2026-08-19T11:00:00Z'),
    });

    const log = await repository.findOneBy({ user: { id: user.id } });

    expect(log).not.toBeNull();
    expect(log?.painLocation).toBe('temporal');
  });

  it('returns null when no log matches', async () => {
    const log = await repository.findOneBy({ painLocation: 'inexistente' });

    expect(log).toBeNull();
  });

  it('finds all logs by criteria', async () => {
    const user = await createUser('m-c@test.com');
    await repository.create({
      user,
      intensity: 3,
      painLocation: 'ocular',
      startedAt: new Date('2026-08-19T12:00:00Z'),
    });
    await repository.create({
      user,
      intensity: 3,
      painLocation: 'nuca',
      startedAt: new Date('2026-08-19T13:00:00Z'),
    });

    const logs = await repository.findAllBy({ intensity: 3 });

    expect(logs.length).toBeGreaterThanOrEqual(2);
  });
});
