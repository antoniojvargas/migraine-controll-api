export interface TerraIngestionPayload {
  terraUserId: string;
  dataType: string;
  periodStart: Date;
  periodEnd: Date;
  receivedAt: Date;
  data: unknown;
}

export interface DataProcessorInterface<TPayload = TerraIngestionPayload> {
  process(payload: TPayload): Promise<void>;
  getName(): string;
  isEnabled(): boolean;
}
