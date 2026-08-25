import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { MongoClient } from 'mongodb';
import { DataProcessorInterface, TerraIngestionPayload } from './data-processor.interface';

export interface DocumentDBDataProcessorConfig {
  enabled: boolean;
  connectionUri: string;
  databaseName: string;
  collectionName: string;
  caBundleBucket: string;
  caBundleKey: string;
}

const CA_BUNDLE_LOCAL_PATH = join(tmpdir(), 'documentdb-ca-bundle.pem');

export class DocumentDBDataProcessor implements DataProcessorInterface {
  private client: MongoClient | null = null;
  private caBundlePath: string | null = null;

  constructor(
    private readonly s3Client: S3Client,
    private readonly config: DocumentDBDataProcessorConfig,
  ) {}

  getName(): string {
    return 'DocumentDBDataProcessor';
  }

  isEnabled(): boolean {
    return this.config.enabled && this.config.connectionUri !== '';
  }

  async process(payload: TerraIngestionPayload): Promise<void> {
    const client = await this.getClient();
    const collection = client.db(this.config.databaseName).collection(this.config.collectionName);

    await collection.insertOne({
      terraUserId: payload.terraUserId,
      dataType: payload.dataType,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      receivedAt: payload.receivedAt,
      data: payload.data,
    });
  }

  async close(): Promise<void> {
    if (this.client !== null) {
      await this.client.close();
      this.client = null;
    }
  }

  private async getClient(): Promise<MongoClient> {
    if (this.client !== null) {
      return this.client;
    }

    const caBundlePath = await this.resolveCaBundle();
    const client = new MongoClient(this.config.connectionUri, {
      tls: true,
      tlsCAFile: caBundlePath,
    });
    await client.connect();
    this.client = client;
    return client;
  }

  private async resolveCaBundle(): Promise<string> {
    if (this.caBundlePath !== null) {
      return this.caBundlePath;
    }
    if (existsSync(CA_BUNDLE_LOCAL_PATH)) {
      this.caBundlePath = CA_BUNDLE_LOCAL_PATH;
      return CA_BUNDLE_LOCAL_PATH;
    }

    const response = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.config.caBundleBucket, Key: this.config.caBundleKey }),
    );
    if (response.Body === undefined) {
      throw new Error('CA bundle object has no body');
    }
    const bytes = await response.Body.transformToByteArray();
    await writeFile(CA_BUNDLE_LOCAL_PATH, Buffer.from(bytes));

    this.caBundlePath = CA_BUNDLE_LOCAL_PATH;
    return CA_BUNDLE_LOCAL_PATH;
  }
}
