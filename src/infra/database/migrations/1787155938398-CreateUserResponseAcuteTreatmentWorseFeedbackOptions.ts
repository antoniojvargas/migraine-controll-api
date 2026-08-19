import { MigrationInterface, QueryRunner } from 'typeorm';

const USER_RESPONSE_ACUTE_TREATMENT_WORSE_FEEDBACK_OPTIONS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'user_response_acute_treatment_worse_feedback_options'
`;

export class CreateUserResponseAcuteTreatmentWorseFeedbackOptions1787155938398 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(
      USER_RESPONSE_ACUTE_TREATMENT_WORSE_FEEDBACK_OPTIONS_TABLE_CHECK,
    );
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "user_response_acute_treatment_worse_feedback_options" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_response_id" uuid NOT NULL, "acute_treatment_worse_feedback_option_id" uuid NOT NULL, CONSTRAINT "PK_b6c32816336ce86046112e31ba2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dee1acfe5fb3e341d3cb9bedaf" ON "user_response_acute_treatment_worse_feedback_options" ("user_response_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_71fbb7fe6e217ef701793944fc" ON "user_response_acute_treatment_worse_feedback_options" ("acute_treatment_worse_feedback_option_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8eeab89141738bd296f9ab3283" ON "user_response_acute_treatment_worse_feedback_options" ("user_response_id", "acute_treatment_worse_feedback_option_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_response_acute_treatment_worse_feedback_options" ADD CONSTRAINT "FK_dee1acfe5fb3e341d3cb9bedafa" FOREIGN KEY ("user_response_id") REFERENCES "user_responses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_response_acute_treatment_worse_feedback_options" ADD CONSTRAINT "FK_71fbb7fe6e217ef701793944fc0" FOREIGN KEY ("acute_treatment_worse_feedback_option_id") REFERENCES "acute_treatment_worse_feedback_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(
      USER_RESPONSE_ACUTE_TREATMENT_WORSE_FEEDBACK_OPTIONS_TABLE_CHECK,
    );
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "user_response_acute_treatment_worse_feedback_options"`);
  }
}
