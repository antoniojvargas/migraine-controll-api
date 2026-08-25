import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { MongoClient } from 'mongodb';

export interface DocumentDbClientConfig {
  connectionUri: string;
  caBundleBucket: string;
  caBundleKey: string;
}

const CA_BUNDLE_LOCAL_PATH = join(tmpdir(), 'documentdb-ca-bundle.pem');

export class DocumentDbClient {
  private client: MongoClient | null = null;
  private caBundlePath: string | null = null;

  constructor(
    private readonly s3Client: S3Client,
    private readonly config: DocumentDbClientConfig,
  ) {}

  async getClient(): Promise<MongoClient> {
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

  async close(): Promise<void> {
    if (this.client !== null) {
      await this.client.close();
      this.client = null;
    }
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
