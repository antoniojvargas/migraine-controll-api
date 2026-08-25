import { DataProcessorInterface, TerraIngestionPayload } from './data-processor.interface';

export interface DataProcessorFailure {
  processorName: string;
  error: Error;
}

export interface MultiDestinationProcessResult {
  succeeded: string[];
  failed: DataProcessorFailure[];
}

const toError = (reason: unknown): Error =>
  reason instanceof Error ? reason : new Error(String(reason));

export class MultiDestinationDataProcessor implements DataProcessorInterface {
  constructor(private readonly processors: DataProcessorInterface[]) {}

  getName(): string {
    return 'MultiDestinationDataProcessor';
  }

  isEnabled(): boolean {
    return this.processors.some((processor) => processor.isEnabled());
  }

  async process(payload: TerraIngestionPayload): Promise<void> {
    const result = await this.dispatch(payload);
    if (result.succeeded.length === 0 && result.failed.length > 0) {
      const details = result.failed
        .map((failure) => `${failure.processorName}: ${failure.error.message}`)
        .join('; ');
      throw new Error(`All data processors failed: ${details}`);
    }
  }

  async dispatch(payload: TerraIngestionPayload): Promise<MultiDestinationProcessResult> {
    const enabledProcessors = this.processors.filter((processor) => processor.isEnabled());
    const settled = await Promise.allSettled(
      enabledProcessors.map((processor) => processor.process(payload)),
    );

    const succeeded: string[] = [];
    const failed: DataProcessorFailure[] = [];

    settled.forEach((outcome, index) => {
      const processorName = enabledProcessors[index].getName();
      if (outcome.status === 'fulfilled') {
        succeeded.push(processorName);
      } else {
        failed.push({ processorName, error: toError(outcome.reason) });
      }
    });

    return { succeeded, failed };
  }
}
