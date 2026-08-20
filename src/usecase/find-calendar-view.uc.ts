import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { FindCalendarViewInputDto } from '@/dto/find-calendar-view-input.dto';
import { CalendarViewOutputDto } from '@/dto/calendar-view-output.dto';
import { DomainError } from '@/domain/domain-error';
import { requireDate, requireNonEmpty } from '@/domain/validation';
import { groupLogsByLocalDate } from '@/utils/calendar-group';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindCalendarViewUc implements UseCaseInterface<
  FindCalendarViewInputDto,
  CalendarViewOutputDto
> {
  private readonly migraineLogRepository: MigraineLogRepository;

  constructor(migraineLogRepository: MigraineLogRepository) {
    this.migraineLogRepository = migraineLogRepository;
  }

  execute = async (input: FindCalendarViewInputDto): Promise<CalendarViewOutputDto> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const from =
        input.from === undefined || input.from === null ? null : requireDate(input.from, 'from');
      const to = input.to === undefined || input.to === null ? null : requireDate(input.to, 'to');
      if (from !== null && to !== null && from.getTime() > to.getTime()) {
        throw new DomainError('from must not be after to');
      }
      const timezone = input.timezone ?? 'UTC';

      const query = this.migraineLogRepository
        .createQueryBuilder('ml')
        .leftJoinAndSelect('ml.user', 'user')
        .where('ml.user_id = :userId', { userId })
        .orderBy('ml.started_at', 'ASC');
      if (from !== null) {
        query.andWhere('ml.started_at >= :from', { from });
      }
      if (to !== null) {
        query.andWhere('ml.started_at <= :to', { to });
      }
      const logs = await query.getMany();

      return {
        userId,
        months: groupLogsByLocalDate(logs, timezone),
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
