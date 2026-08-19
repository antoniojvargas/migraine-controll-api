import { MigrationInterface, QueryRunner } from 'typeorm';

const PREVENTIVE_TREATMENT_SCHEDULE_METADATA_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'preventive_treatment_schedule_metadata'
`;

export class CreatePreventiveTreatmentScheduleMetadata1787155733401 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREVENTIVE_TREATMENT_SCHEDULE_METADATA_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "preventive_treatment_schedule_metadata" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "status" character varying NOT NULL DEFAULT 'pending', "reminded_at" TIMESTAMP WITH TIME ZONE, "logged_at" TIMESTAMP WITH TIME ZONE, "preventive_treatment_schedule_id" uuid NOT NULL, CONSTRAINT "PK_0905ffc31e7a175b714174ec310" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee7ca77bf6a4d9036ad67a33de" ON "preventive_treatment_schedule_metadata" ("preventive_treatment_schedule_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "preventive_treatment_schedule_metadata" ADD CONSTRAINT "FK_ee7ca77bf6a4d9036ad67a33de5" FOREIGN KEY ("preventive_treatment_schedule_id") REFERENCES "preventive_treatment_schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREVENTIVE_TREATMENT_SCHEDULE_METADATA_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "preventive_treatment_schedule_metadata"`);
  }
}
