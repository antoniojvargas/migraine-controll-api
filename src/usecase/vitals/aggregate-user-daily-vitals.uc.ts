import { Collection } from 'mongodb';
import { DocumentDbClient } from '@/infra/documentdb/documentdb-client';
import { TerraUserRepository } from '@/infra/database/repository/terra-user.repository';
import { UserDailyVitalsRepository } from '@/infra/database/repository/user-daily-vitals.repository';
import { UseCaseInterface } from '@/usecase/usecase.interface';

const SLEEP_DATA_TYPE = 'sleep';
const ACTIVITY_DATA_TYPE = 'activity';
const LOOKBACK_DAYS = 2;

interface RawVitalsPayload {
  sleepDurationSeconds?: number;
  sleepScore?: number;
  steps?: number;
  caloriesBurned?: number;
  restingHeartRate?: number;
}

interface RawHealthDataDocument {
  terraUserId: string;
  dataType: string;
  periodStart: Date;
  data: RawVitalsPayload;
}

interface DailyVitalsAccumulator {
  terraUserId: string;
  dateLocal: string;
  sleepDurationMinutesSum: number;
  sleepDurationCount: number;
  sleepScoreSum: number;
  sleepScoreCount: number;
  steps: number;
  caloriesBurned: number;
  restingHeartRateSum: number;
  restingHeartRateCount: number;
}

export interface AggregateUserDailyVitalsInput {
  since?: Date;
}

export interface AggregateUserDailyVitalsOutput {
  daysProcessed: number;
  skippedUnknownUsers: number;
}

export class AggregateUserDailyVitalsUc implements UseCaseInterface<
  AggregateUserDailyVitalsInput | undefined,
  AggregateUserDailyVitalsOutput
> {
  constructor(
    private readonly documentDbClient: DocumentDbClient,
    private readonly databaseName: string,
    private readonly collectionName: string,
    private readonly terraUserRepository: TerraUserRepository,
    private readonly userDailyVitalsRepository: UserDailyVitalsRepository,
  ) {}

  execute = async (
    input: AggregateUserDailyVitalsInput = {},
  ): Promise<AggregateUserDailyVitalsOutput> => {
    const since = input.since ?? new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const collection = await this.getCollection();

    const documents = (await collection
      .find({
        dataType: { $in: [SLEEP_DATA_TYPE, ACTIVITY_DATA_TYPE] },
        periodStart: { $gte: since },
      })
      .toArray()) as unknown as RawHealthDataDocument[];

    const accumulators = this.groupByUserAndDate(documents);

    let daysProcessed = 0;
    let skippedUnknownUsers = 0;
    for (const accumulator of accumulators.values()) {
      const userId = await this.resolveUserId(accumulator.terraUserId);
      if (userId === null) {
        skippedUnknownUsers += 1;
        continue;
      }

      await this.userDailyVitalsRepository.upsertByUserAndDate({
        user: { id: userId },
        dateLocal: accumulator.dateLocal,
        sleepDurationMinutes: this.average(
          accumulator.sleepDurationMinutesSum,
          accumulator.sleepDurationCount,
        ),
        sleepScore: this.average(accumulator.sleepScoreSum, accumulator.sleepScoreCount),
        steps: accumulator.steps === 0 ? null : accumulator.steps,
        caloriesBurned: accumulator.caloriesBurned === 0 ? null : accumulator.caloriesBurned,
        restingHeartRate: this.average(
          accumulator.restingHeartRateSum,
          accumulator.restingHeartRateCount,
        ),
      });
      daysProcessed += 1;
    }

    return { daysProcessed, skippedUnknownUsers };
  };

  private async getCollection(): Promise<Collection> {
    const client = await this.documentDbClient.getClient();
    return client.db(this.databaseName).collection(this.collectionName);
  }

  private async resolveUserId(terraUserId: string): Promise<string | null> {
    const terraUser = await this.terraUserRepository
      .createQueryBuilder('terraUser')
      .leftJoinAndSelect('terraUser.user', 'user')
      .where('terraUser.terraUserId = :terraUserId', { terraUserId })
      .getOne();

    return terraUser?.user.id ?? null;
  }

  private groupByUserAndDate(
    documents: RawHealthDataDocument[],
  ): Map<string, DailyVitalsAccumulator> {
    const accumulators = new Map<string, DailyVitalsAccumulator>();

    for (const document of documents) {
      const dateLocal = this.toDateLocal(document.periodStart);
      const key = `${document.terraUserId}:${dateLocal}`;
      const accumulator = accumulators.get(key) ?? {
        terraUserId: document.terraUserId,
        dateLocal,
        sleepDurationMinutesSum: 0,
        sleepDurationCount: 0,
        sleepScoreSum: 0,
        sleepScoreCount: 0,
        steps: 0,
        caloriesBurned: 0,
        restingHeartRateSum: 0,
        restingHeartRateCount: 0,
      };

      if (document.dataType === SLEEP_DATA_TYPE) {
        if (typeof document.data.sleepDurationSeconds === 'number') {
          accumulator.sleepDurationMinutesSum += document.data.sleepDurationSeconds / 60;
          accumulator.sleepDurationCount += 1;
        }
        if (typeof document.data.sleepScore === 'number') {
          accumulator.sleepScoreSum += document.data.sleepScore;
          accumulator.sleepScoreCount += 1;
        }
      }

      if (document.dataType === ACTIVITY_DATA_TYPE) {
        accumulator.steps += document.data.steps ?? 0;
        accumulator.caloriesBurned += document.data.caloriesBurned ?? 0;
        if (typeof document.data.restingHeartRate === 'number') {
          accumulator.restingHeartRateSum += document.data.restingHeartRate;
          accumulator.restingHeartRateCount += 1;
        }
      }

      accumulators.set(key, accumulator);
    }

    return accumulators;
  }

  private toDateLocal(periodStart: Date): string {
    return new Date(periodStart).toISOString().slice(0, 10);
  }

  private average(sum: number, count: number): number | null {
    return count === 0 ? null : sum / count;
  }
}
