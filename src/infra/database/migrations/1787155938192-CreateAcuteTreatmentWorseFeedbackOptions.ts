import { MigrationInterface, QueryRunner } from 'typeorm';

const ACUTE_TREATMENT_WORSE_FEEDBACK_OPTIONS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'acute_treatment_worse_feedback_options'
`;

export class CreateAcuteTreatmentWorseFeedbackOptions1787155938192 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(ACUTE_TREATMENT_WORSE_FEEDBACK_OPTIONS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "acute_treatment_worse_feedback_options" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "key" character varying NOT NULL, "text" character varying NOT NULL, CONSTRAINT "UQ_98dad45d0274739409a65cd7a32" UNIQUE ("key"), CONSTRAINT "PK_0123bb8abdb974ed88dea5ae3f3" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(ACUTE_TREATMENT_WORSE_FEEDBACK_OPTIONS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "acute_treatment_worse_feedback_options"`);
  }
}
