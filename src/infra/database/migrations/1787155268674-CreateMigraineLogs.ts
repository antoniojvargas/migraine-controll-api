import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRAINE_LOGS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'migraine_logs'
`;

export class CreateMigraineLogs1787155268674 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(MIGRAINE_LOGS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "migraine_logs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "intensity" integer NOT NULL, "pain_location" character varying NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ended_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "session_id" uuid, CONSTRAINT "PK_0197e03abdc2f12dc17924b6bd4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_501b756b2d1d46fd2015da4201" ON "migraine_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c844fd3df7690ae53218341cb2" ON "migraine_logs" ("session_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "migraine_logs" ADD CONSTRAINT "FK_501b756b2d1d46fd2015da4201f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "migraine_logs" ADD CONSTRAINT "FK_c844fd3df7690ae53218341cb24" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(MIGRAINE_LOGS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "migraine_logs"`);
  }
}
