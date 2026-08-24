import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { UseCaseInterface } from '@/usecase/usecase.interface';
import { calculateAverageMigrainesPerWeek, getWeekKey } from './dateHelpers';
import { notifyUsers } from './notificationHelpers';

const LOOKBACK_WEEKS = 8;
const SIGNIFICANT_CHANGE_THRESHOLD = 0.5;

export interface SendWeeklyMigraineTrendAlertsOutput {
  alertsSent: number;
}

interface MigraineLogDateRow {
  userId: string;
  startedAt: Date | string;
}

export class SendWeeklyMigraineTrendAlertsUc implements UseCaseInterface<
  void,
  SendWeeklyMigraineTrendAlertsOutput
> {
  constructor(
    private readonly migraineLogRepository: MigraineLogRepository,
    private readonly pushNotificationTokenRepository: PushNotificationTokenRepository,
  ) {}

  execute = async (): Promise<SendWeeklyMigraineTrendAlertsOutput> => {
    const logsByUser = await this.findRecentLogDatesByUser();
    const currentWeekKey = getWeekKey(new Date());

    let alertsSent = 0;
    for (const [userId, dates] of logsByUser) {
      const currentWeekCount = dates.filter((date) => getWeekKey(date) === currentWeekKey).length;
      const previousDates = dates.filter((date) => getWeekKey(date) !== currentWeekKey);

      if (previousDates.length === 0) {
        continue;
      }

      const baselineAverage = calculateAverageMigrainesPerWeek(previousDates);
      if (!this.isSignificantVariation(currentWeekCount, baselineAverage)) {
        continue;
      }

      const tokens = await this.pushNotificationTokenRepository.findAllBy({
        user: { id: userId },
      });

      await notifyUsers(
        [{ userId, tokens }],
        this.buildNotificationPayload(currentWeekCount, baselineAverage),
      );
      alertsSent += 1;
    }

    return { alertsSent };
  };

  private findRecentLogDatesByUser = async (): Promise<Map<string, Date[]>> => {
    const since = new Date(Date.now() - LOOKBACK_WEEKS * 7 * 24 * 60 * 60 * 1000);
    const rows = await this.migraineLogRepository
      .createQueryBuilder('log')
      .select('log.user_id', 'userId')
      .addSelect('log.started_at', 'startedAt')
      .where('log.started_at >= :since', { since })
      .getRawMany<MigraineLogDateRow>();

    const logsByUser = new Map<string, Date[]>();
    for (const row of rows) {
      const dates = logsByUser.get(row.userId) ?? [];
      dates.push(new Date(row.startedAt));
      logsByUser.set(row.userId, dates);
    }
    return logsByUser;
  };

  private isSignificantVariation(currentWeekCount: number, baselineAverage: number): boolean {
    if (baselineAverage === 0) {
      return currentWeekCount > 0;
    }
    return (
      Math.abs(currentWeekCount - baselineAverage) / baselineAverage >= SIGNIFICANT_CHANGE_THRESHOLD
    );
  }

  private buildNotificationPayload(
    currentWeekCount: number,
    baselineAverage: number,
  ): { title: string; body: string; data: Record<string, string> } {
    const direction = currentWeekCount > baselineAverage ? 'increase' : 'decrease';
    return {
      title: 'Weekly migraine trend',
      body:
        `This week you logged ${currentWeekCount} migraine${currentWeekCount === 1 ? '' : 's'}, ` +
        `a significant ${direction} from your usual average of ${baselineAverage.toFixed(1)} per week.`,
      data: {
        currentWeekCount: String(currentWeekCount),
        baselineAverage: baselineAverage.toFixed(2),
        direction,
      },
    };
  }
}
