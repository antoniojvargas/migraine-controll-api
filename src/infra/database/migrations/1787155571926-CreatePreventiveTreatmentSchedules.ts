import { MigrationInterface, QueryRunner } from 'typeorm';

const PREVENTIVE_TREATMENT_SCHEDULES_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'preventive_treatment_schedules'
`;

export class CreatePreventiveTreatmentSchedules1787155571926 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREVENTIVE_TREATMENT_SCHEDULES_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "preventive_treatment_schedules" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reminder_before_log" integer, "preventive_treatment_id" uuid NOT NULL, CONSTRAINT "PK_d45c0dced2008520d663a2a5696" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_62f9c0ef6bddad8662732e1eb8" ON "preventive_treatment_schedules" ("preventive_treatment_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "preventive_treatment_schedules" ADD CONSTRAINT "FK_62f9c0ef6bddad8662732e1eb88" FOREIGN KEY ("preventive_treatment_id") REFERENCES "preventive_treatments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREVENTIVE_TREATMENT_SCHEDULES_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "preventive_treatment_schedules"`);
  }
}
