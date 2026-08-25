import { MigrationInterface, QueryRunner } from 'typeorm';

const TERRA_USERS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'terra_users'
`;

export class CreateTerraEntities1787600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TERRA_USERS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "terra_users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "terra_user_id" character varying NOT NULL, "provider" character varying NOT NULL, "scopes" character varying, "active" boolean NOT NULL DEFAULT true, "last_webhook_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "PK_terra_users_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_terra_users_terra_user_id" ON "terra_users" ("terra_user_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_terra_users_user_id" ON "terra_users" ("user_id")`);
    await queryRunner.query(
      `ALTER TABLE "terra_users" ADD CONSTRAINT "FK_terra_users_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "terra_health_data" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "data_type" character varying NOT NULL, "period_start" TIMESTAMP WITH TIME ZONE NOT NULL, "period_end" TIMESTAMP WITH TIME ZONE NOT NULL, "data" jsonb NOT NULL, "s3_raw_payload_key" character varying, "ingested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "terra_user_id" uuid NOT NULL, CONSTRAINT "PK_terra_health_data_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_terra_health_data_terra_user_id" ON "terra_health_data" ("terra_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_terra_health_data_terra_user_id_period_start" ON "terra_health_data" ("terra_user_id", "period_start")`,
    );
    await queryRunner.query(
      `ALTER TABLE "terra_health_data" ADD CONSTRAINT "FK_terra_health_data_terra_user_id" FOREIGN KEY ("terra_user_id") REFERENCES "terra_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "terra_webhook_logs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "terra_user_id" character varying, "event_type" character varying NOT NULL, "status" character varying NOT NULL, "s3_raw_payload_key" character varying, "error_message" character varying, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_terra_webhook_logs_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_terra_webhook_logs_terra_user_id" ON "terra_webhook_logs" ("terra_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_terra_webhook_logs_received_at" ON "terra_webhook_logs" ("received_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TERRA_USERS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "terra_webhook_logs"`);
    await queryRunner.query(`DROP TABLE "terra_health_data"`);
    await queryRunner.query(`DROP TABLE "terra_users"`);
  }
}
