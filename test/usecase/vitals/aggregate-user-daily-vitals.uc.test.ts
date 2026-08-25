import { AggregateUserDailyVitalsUc } from '@/usecase/vitals/aggregate-user-daily-vitals.uc';
import { DocumentDbClient } from '@/infra/documentdb/documentdb-client';
import { TerraUserRepository } from '@/infra/database/repository/terra-user.repository';
import { UserDailyVitalsRepository } from '@/infra/database/repository/user-daily-vitals.repository';
import { createQueryBuilderMock } from '../helpers';

describe('AggregateUserDailyVitalsUc', () => {
  const buildDocumentDbClient = (documents: unknown[]): jest.Mocked<DocumentDbClient> => {
    const toArray = jest.fn().mockResolvedValue(documents);
    const find = jest.fn().mockReturnValue({ toArray });
    const collection = jest.fn().mockReturnValue({ find });
    const db = jest.fn().mockReturnValue({ collection });
    return {
      getClient: jest.fn().mockResolvedValue({ db }),
    } as unknown as jest.Mocked<DocumentDbClient>;
  };

  const buildTerraUserRepository = (
    getOne: unknown,
  ): {
    repository: jest.Mocked<TerraUserRepository>;
    query: ReturnType<typeof createQueryBuilderMock>;
  } => {
    const query = createQueryBuilderMock({ getOne });
    return {
      repository: {
        createQueryBuilder: jest.fn().mockReturnValue(query),
      } as unknown as jest.Mocked<TerraUserRepository>,
      query,
    };
  };

  const buildUserDailyVitalsRepository = (): jest.Mocked<UserDailyVitalsRepository> =>
    ({
      upsertByUserAndDate: jest.fn().mockResolvedValue(undefined),
    }) as unknown as jest.Mocked<UserDailyVitalsRepository>;

  it('groups sleep and activity documents by user and date and upserts the aggregate', async () => {
    const documents = [
      {
        terraUserId: 'terra-1',
        dataType: 'sleep',
        periodStart: new Date('2026-08-24T22:00:00.000Z'),
        data: { sleepDurationSeconds: 7200, sleepScore: 80 },
      },
      {
        terraUserId: 'terra-1',
        dataType: 'activity',
        periodStart: new Date('2026-08-24T22:00:00.000Z'),
        data: { steps: 5000, caloriesBurned: 200, restingHeartRate: 60 },
      },
      {
        terraUserId: 'terra-1',
        dataType: 'activity',
        periodStart: new Date('2026-08-24T23:00:00.000Z'),
        data: { steps: 3000, caloriesBurned: 100, restingHeartRate: 62 },
      },
    ];
    const documentDbClient = buildDocumentDbClient(documents);
    const { repository: terraUserRepository } = buildTerraUserRepository({
      user: { id: 'user-1' },
    });
    const userDailyVitalsRepository = buildUserDailyVitalsRepository();

    const result = await new AggregateUserDailyVitalsUc(
      documentDbClient,
      'terra',
      'health_data',
      terraUserRepository,
      userDailyVitalsRepository,
    ).execute();

    expect(result).toEqual({ daysProcessed: 1, skippedUnknownUsers: 0 });
    expect(userDailyVitalsRepository.upsertByUserAndDate).toHaveBeenCalledWith({
      user: { id: 'user-1' },
      dateLocal: '2026-08-24',
      sleepDurationMinutes: 120,
      sleepScore: 80,
      steps: 8000,
      caloriesBurned: 300,
      restingHeartRate: 61,
    });
  });

  it('skips users with no matching TerraUserEntity', async () => {
    const documents = [
      {
        terraUserId: 'terra-unknown',
        dataType: 'sleep',
        periodStart: new Date('2026-08-24T22:00:00.000Z'),
        data: { sleepDurationSeconds: 3600 },
      },
    ];
    const documentDbClient = buildDocumentDbClient(documents);
    const { repository: terraUserRepository } = buildTerraUserRepository(null);
    const userDailyVitalsRepository = buildUserDailyVitalsRepository();

    const result = await new AggregateUserDailyVitalsUc(
      documentDbClient,
      'terra',
      'health_data',
      terraUserRepository,
      userDailyVitalsRepository,
    ).execute();

    expect(result).toEqual({ daysProcessed: 0, skippedUnknownUsers: 1 });
    expect(userDailyVitalsRepository.upsertByUserAndDate).not.toHaveBeenCalled();
  });

  it('returns no work when there are no documents', async () => {
    const documentDbClient = buildDocumentDbClient([]);
    const { repository: terraUserRepository } = buildTerraUserRepository(null);
    const userDailyVitalsRepository = buildUserDailyVitalsRepository();

    const result = await new AggregateUserDailyVitalsUc(
      documentDbClient,
      'terra',
      'health_data',
      terraUserRepository,
      userDailyVitalsRepository,
    ).execute();

    expect(result).toEqual({ daysProcessed: 0, skippedUnknownUsers: 0 });
  });
});
