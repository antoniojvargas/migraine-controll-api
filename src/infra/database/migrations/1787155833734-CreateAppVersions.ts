import { MigrationInterface, QueryRunner } from 'typeorm';

const APP_VERSIONS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'app_versions'
`;

export class CreateAppVersions1787155833734 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(APP_VERSIONS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "app_versions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "platform" character varying NOT NULL, "version" character varying NOT NULL, "force_update" boolean NOT NULL DEFAULT false, "announcement" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_764a2ab4e49ad36d1f9eca9cc9f" UNIQUE ("platform"), CONSTRAINT "PK_8d36b0dcf0c026c7aad923c80fd" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(APP_VERSIONS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "app_versions"`);
  }
}
