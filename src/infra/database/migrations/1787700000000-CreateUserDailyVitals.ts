import { MigrationInterface, QueryRunner } from 'typeorm';

const USER_DAILY_VITALS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'user_daily_vitals'
`;

export class CreateUserDailyVitals1787700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(USER_DAILY_VITALS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "user_daily_vitals" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "date_local" date NOT NULL, "sleep_duration_minutes" integer, "sleep_score" numeric, "steps" integer, "calories_burned" integer, "resting_heart_rate" numeric, "computed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "PK_user_daily_vitals_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_daily_vitals_user_id_date_local" ON "user_daily_vitals" ("user_id", "date_local")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_daily_vitals_date_local" ON "user_daily_vitals" ("date_local")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_daily_vitals" ADD CONSTRAINT "FK_user_daily_vitals_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(USER_DAILY_VITALS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "user_daily_vitals"`);
  }
}
