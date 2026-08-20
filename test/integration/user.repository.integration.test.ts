import { dataSource } from '@/infra/database/dataSource';
import { UserEntity } from '@/infra/database/entities';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { initTestDb } from './helpers';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeAll(async () => {
    await initTestDb();
    repository = new UserRepository(dataSource.getRepository(UserEntity));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('creates a user', async () => {
    const user = await repository.create({ email: 'a@test.com', externalId: 'ext-a' });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('a@test.com');
    expect(user.externalId).toBe('ext-a');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('finds a user by criteria', async () => {
    await repository.create({ email: 'b@test.com', externalId: 'ext-b' });

    const user = await repository.findOneBy({ email: 'b@test.com' });

    expect(user).not.toBeNull();
    expect(user?.externalId).toBe('ext-b');
  });

  it('returns null when no user matches', async () => {
    const user = await repository.findOneBy({ email: 'missing@test.com' });

    expect(user).toBeNull();
  });

  it('finds all users by criteria', async () => {
    await repository.create({
      email: 'c1@test.com',
      externalId: 'ext-c1',
      originalEmail: 'shared',
    });
    await repository.create({
      email: 'c2@test.com',
      externalId: 'ext-c2',
      originalEmail: 'shared',
    });

    const users = await repository.findAllBy({ originalEmail: 'shared' });

    expect(users).toHaveLength(2);
  });
});
