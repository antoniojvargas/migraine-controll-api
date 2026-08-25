import { DomainError } from '@/domain/domain-error';
import { TerraWebhookLogRepository } from '@/infra/database/repository/terra-webhook-log.repository';
import { MultiDestinationDataProcessor } from '@/infra/processors/multi-destination-data-processor';
import { TerraIngestionPayload } from '@/infra/processors/data-processor.interface';
import { TerraWebhookDataItemDto, TerraWebhookPayloadDto } from '@/dto/terra-webhook-payload.dto';
import { UseCaseInterface } from '@/usecase/usecase.interface';

export type ProcessTerraWebhookStatus = 'ignored' | 'processed' | 'partial_failure' | 'failed';

export interface ProcessTerraWebhookOutput {
  status: ProcessTerraWebhookStatus;
  processedItems: number;
  failedItems: number;
}

export class ProcessTerraWebhookUc implements UseCaseInterface<
  TerraWebhookPayloadDto,
  ProcessTerraWebhookOutput
> {
  constructor(
    private readonly terraWebhookLogRepository: TerraWebhookLogRepository,
    private readonly multiDestinationDataProcessor: MultiDestinationDataProcessor,
  ) {}

  execute = async (payload: TerraWebhookPayloadDto): Promise<ProcessTerraWebhookOutput> => {
    if (payload.type === undefined || payload.type.trim().length === 0) {
      throw new DomainError('type is required');
    }

    const terraUserId = payload.user?.user_id ?? null;
    const receivedAt = new Date();
    const items = payload.data ?? [];

    if (items.length === 0) {
      await this.terraWebhookLogRepository.create({
        terraUserId,
        eventType: payload.type,
        status: 'received',
        errorMessage: null,
        s3RawPayloadKey: null,
        receivedAt,
      });
      return { status: 'ignored', processedItems: 0, failedItems: 0 };
    }

    let processedItems = 0;
    let failedItems = 0;

    for (const item of items) {
      const ingestionPayload = this.toIngestionPayload(payload.type, terraUserId, receivedAt, item);
      const result = await this.multiDestinationDataProcessor.dispatch(ingestionPayload);
      const failed = result.succeeded.length === 0;

      if (failed) {
        failedItems += 1;
      } else {
        processedItems += 1;
      }

      await this.terraWebhookLogRepository.create({
        terraUserId,
        eventType: payload.type,
        status: failed ? 'failed' : 'processed',
        errorMessage: failed
          ? result.failed
              .map((failure) => `${failure.processorName}: ${failure.error.message}`)
              .join('; ')
          : null,
        s3RawPayloadKey: null,
        receivedAt,
      });
    }

    return {
      status: this.resolveOverallStatus(processedItems, failedItems),
      processedItems,
      failedItems,
    };
  };

  private toIngestionPayload(
    dataType: string,
    terraUserId: string | null,
    receivedAt: Date,
    item: TerraWebhookDataItemDto,
  ): TerraIngestionPayload {
    const startTime = item.metadata?.start_time;
    const endTime = item.metadata?.end_time;
    return {
      terraUserId: terraUserId ?? 'unknown',
      dataType,
      periodStart: startTime !== undefined ? new Date(startTime) : receivedAt,
      periodEnd: endTime !== undefined ? new Date(endTime) : receivedAt,
      receivedAt,
      data: item,
    };
  }

  private resolveOverallStatus(
    processedItems: number,
    failedItems: number,
  ): ProcessTerraWebhookStatus {
    if (failedItems === 0) {
      return 'processed';
    }
    return processedItems === 0 ? 'failed' : 'partial_failure';
  }
}
