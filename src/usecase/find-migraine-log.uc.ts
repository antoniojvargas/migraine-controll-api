import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { FindMigraineLogInputDto } from '@/dto/find-migraine-log-input.dto';
import { MigraineLogEntryOutputDto } from '@/dto/migraine-log-entry-output.dto';
import { requireNonEmpty } from '@/domain/validation';
import { toMigraineLogEntry } from '@/utils/migraine-log-mapper';
import { AppError } from '@/utils/app-error';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindMigraineLogUc implements UseCaseInterface<
  FindMigraineLogInputDto,
  MigraineLogEntryOutputDto
> {
  private readonly migraineLogRepository: MigraineLogRepository;

  constructor(migraineLogRepository: MigraineLogRepository) {
    this.migraineLogRepository = migraineLogRepository;
  }

  execute = async (input: FindMigraineLogInputDto): Promise<MigraineLogEntryOutputDto> => {
    try {
      const id = requireNonEmpty(input.id, 'id');
      const userId = requireNonEmpty(input.userId, 'userId');

      const entity = await this.migraineLogRepository
        .createQueryBuilder('ml')
        .leftJoinAndSelect('ml.user', 'user')
        .where('ml.id = :id', { id })
        .andWhere('ml.user_id = :userId', { userId })
        .getOne();
      if (entity === null) {
        throw new AppError(404, 'MIGRAINE_LOG_NOT_FOUND', 'Migraine log not found');
      }
      return toMigraineLogEntry(entity);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
