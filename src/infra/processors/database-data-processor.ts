import { DomainError } from '@/domain/domain-error';
import { TerraHealthDataRepository } from '@/infra/database/repository/terra-health-data.repository';
import { TerraUserRepository } from '@/infra/database/repository/terra-user.repository';
import { DataProcessorInterface, TerraIngestionPayload } from './data-processor.interface';

export class DatabaseDataProcessor implements DataProcessorInterface {
  constructor(
    private readonly terraUserRepository: TerraUserRepository,
    private readonly terraHealthDataRepository: TerraHealthDataRepository,
  ) {}

  getName(): string {
    return 'DatabaseDataProcessor';
  }

  isEnabled(): boolean {
    return true;
  }

  async process(payload: TerraIngestionPayload): Promise<void> {
    const terraUser = await this.terraUserRepository.findByTerraUserId(payload.terraUserId);
    if (terraUser === null) {
      throw new DomainError(`Unknown Terra user: ${payload.terraUserId}`);
    }

    await this.terraHealthDataRepository.create({
      terraUser,
      dataType: payload.dataType,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      data: payload.data,
    });
  }
}
