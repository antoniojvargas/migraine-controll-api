import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DataProcessorInterface, TerraIngestionPayload } from './data-processor.interface';

export class S3DataProcessor implements DataProcessorInterface {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucket: string,
  ) {}

  getName(): string {
    return 'S3DataProcessor';
  }

  isEnabled(): boolean {
    return this.bucket !== '';
  }

  async process(payload: TerraIngestionPayload): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.buildKey(payload),
        Body: JSON.stringify(payload.data),
        ContentType: 'application/json',
      }),
    );
  }

  private buildKey(payload: TerraIngestionPayload): string {
    const date = payload.receivedAt.toISOString().slice(0, 10);
    const timestamp = payload.receivedAt.getTime();
    return `terra-payloads/${date}/${payload.dataType}/${payload.terraUserId}-${timestamp}.json`;
  }
}
