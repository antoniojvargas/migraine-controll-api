import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { FindMigraineLogsInputDto } from '@/dto/find-migraine-logs-input.dto';
import { FindMigraineLogsOutputDto } from '@/dto/find-migraine-logs-output.dto';
import { parseDateRange, requireNonEmpty } from '@/domain/validation';
import { toMigraineLogEntry } from '@/utils/migraine-log-mapper';
import { buildWeeklyStatistics } from '@/utils/weekly-stats';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindMigraineLogsUc implements UseCaseInterface<
  FindMigraineLogsInputDto,
  FindMigraineLogsOutputDto
> {
  private readonly migraineLogRepository: MigraineLogRepository;
  private readonly scheduleRepository: PreventiveTreatmentScheduleRepository;

  constructor(
    migraineLogRepository: MigraineLogRepository,
    scheduleRepository: PreventiveTreatmentScheduleRepository,
  ) {
    this.migraineLogRepository = migraineLogRepository;
    this.scheduleRepository = scheduleRepository;
  }

  execute = async (input: FindMigraineLogsInputDto): Promise<FindMigraineLogsOutputDto> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const { from, to } = parseDateRange(input);

      const logQuery = this.migraineLogRepository
        .createQueryBuilder('ml')
        .leftJoinAndSelect('ml.user', 'user')
        .where('ml.user_id = :userId', { userId })
        .orderBy('ml.started_at', 'DESC');
      if (from !== null) {
        logQuery.andWhere('ml.started_at >= :from', { from });
      }
      if (to !== null) {
        logQuery.andWhere('ml.started_at <= :to', { to });
      }
      const logs = await logQuery.getMany();

      const scheduleQuery = this.scheduleRepository
        .createQueryBuilder('pts')
        .innerJoin('pts.treatment', 'pt')
        .where('pt.user_id = :userId', { userId });
      if (from !== null) {
        scheduleQuery.andWhere('pts.scheduled_at >= :from', { from });
      }
      if (to !== null) {
        scheduleQuery.andWhere('pts.scheduled_at <= :to', { to });
      }
      const schedules = await scheduleQuery.getMany();

      return {
        logs: logs.map((log) => toMigraineLogEntry(log)),
        weeks: buildWeeklyStatistics(logs, schedules, from, to),
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
