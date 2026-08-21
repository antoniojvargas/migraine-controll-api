import { seedData } from '@/infra/database/seeds/utils/baseSeeder';
import { UserEntity } from '@/infra/database/entities';

describe('seedData', () => {
  const buildDataSource = (saveResult: unknown, overrides: Record<string, unknown> = {}) =>
    ({
      isInitialized: true,
      getRepository: jest.fn(() => ({
        create: jest.fn((data: unknown) => data),
        save: jest.fn().mockResolvedValue(saveResult),
        ...overrides,
      })),
    }) as never;

  it('creates and saves the seeded rows through the entity repository', async () => {
    const rows = [
      { email: 'a@test.com', externalId: 'ext-a' },
      { email: 'b@test.com', externalId: 'ext-b' },
    ];
    const dataSource = buildDataSource(rows);
    const getRepository = (dataSource as unknown as { getRepository: jest.Mock }).getRepository;

    const result = await seedData(dataSource, UserEntity, rows, 'users');

    expect(getRepository).toHaveBeenCalledWith(UserEntity);
    expect(result).toEqual(rows);
  });

  it('returns an empty array without touching the database when data is empty', async () => {
    const dataSource = buildDataSource([]);
    const getRepository = (dataSource as unknown as { getRepository: jest.Mock }).getRepository;

    const result = await seedData(dataSource, UserEntity, [], 'users');

    expect(result).toEqual([]);
    expect(getRepository).not.toHaveBeenCalled();
  });

  it('throws an enriched error naming the entity when saving fails', async () => {
    const dataSource = buildDataSource(undefined, {
      save: jest.fn().mockRejectedValue(new Error('duplicate key')),
    });

    await expect(seedData(dataSource, UserEntity, [{ email: 'x' }], 'users')).rejects.toThrow(
      '[seed:users] failed to seed 1 rows: duplicate key',
    );
  });

  it('throws when the dataSource is not initialized', async () => {
    const dataSource = { isInitialized: false } as never;

    await expect(seedData(dataSource, UserEntity, [{ email: 'x' }], 'users')).rejects.toThrow(
      '[seed:users] dataSource is not initialized',
    );
  });
});
