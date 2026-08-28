import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { FindReportInputDto } from '@/dto/find-report-input.dto';
import { ReportOutputDto } from '@/dto/report-output.dto';
import { DomainError } from '@/domain/domain-error';
import { MIGRAINE_SYMPTOMS_QUESTION_KEY, MIGRAINE_TRIGGERS_QUESTION_KEY } from '@/domain/constants';
import { requireDate, requireNonEmpty } from '@/domain/validation';
import {
  buildDayOfWeekDistribution,
  buildDurationStats,
  buildIntensityDistribution,
  buildIntensityStats,
  buildMonthlyAverage,
  buildTopAnswers,
  buildTopTreatments,
} from '@/utils/report-stats';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindReportUc implements UseCaseInterface<FindReportInputDto, ReportOutputDto> {
  private readonly migraineLogRepository: MigraineLogRepository;
  private readonly newUserResponseRepository: NewUserResponseRepository;
  private readonly scheduleRepository: PreventiveTreatmentScheduleRepository;

  constructor(
    migraineLogRepository: MigraineLogRepository,
    newUserResponseRepository: NewUserResponseRepository,
    scheduleRepository: PreventiveTreatmentScheduleRepository,
  ) {
    this.migraineLogRepository = migraineLogRepository;
    this.newUserResponseRepository = newUserResponseRepository;
    this.scheduleRepository = scheduleRepository;
  }

  execute = async (input: FindReportInputDto): Promise<ReportOutputDto> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const from =
        input.from === undefined || input.from === null ? null : requireDate(input.from, 'from');
      const to = input.to === undefined || input.to === null ? null : requireDate(input.to, 'to');
      if (from !== null && to !== null && from.getTime() > to.getTime()) {
        throw new DomainError('from must not be after to');
      }

      const logQuery = this.migraineLogRepository
        .createQueryBuilder('ml')
        .where('ml.user_id = :userId', { userId });
      if (from !== null) {
        logQuery.andWhere('ml.started_at >= :from', { from });
      }
      if (to !== null) {
        logQuery.andWhere('ml.started_at <= :to', { to });
      }
      const logs = await logQuery.getMany();

      const triggerResponses = await this.findResponsesByQuestionKey(
        userId,
        MIGRAINE_TRIGGERS_QUESTION_KEY,
        from,
        to,
      );
      const symptomResponses = await this.findResponsesByQuestionKey(
        userId,
        MIGRAINE_SYMPTOMS_QUESTION_KEY,
        from,
        to,
      );

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
        userId,
        from: from !== null ? from.toISOString() : null,
        to: to !== null ? to.toISOString() : null,
        totalMigraines: logs.length,
        intensity: buildIntensityStats(logs),
        duration: buildDurationStats(logs),
        topTriggers: buildTopAnswers(triggerResponses),
        topSymptoms: buildTopAnswers(symptomResponses),
        topTreatments: buildTopTreatments(schedules),
        dayOfWeekDistribution: buildDayOfWeekDistribution(logs),
        intensityDistribution: buildIntensityDistribution(logs),
        monthlyAverage: buildMonthlyAverage(logs, from, to),
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private findResponsesByQuestionKey(
    userId: string,
    questionKey: string,
    from: Date | null,
    to: Date | null,
  ) {
    const query = this.newUserResponseRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.question', 'question')
      .innerJoin('ur.migraineLog', 'ml')
      .leftJoinAndSelect('ur.selection', 'selection')
      .where('ur.user_id = :userId', { userId })
      .andWhere('question.key = :questionKey', { questionKey });
    if (from !== null) {
      query.andWhere('ml.started_at >= :from', { from });
    }
    if (to !== null) {
      query.andWhere('ml.started_at <= :to', { to });
    }
    return query.getMany();
  }
}
