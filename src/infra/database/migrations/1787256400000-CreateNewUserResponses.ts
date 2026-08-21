import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'new_user_responses'
`;

export class CreateNewUserResponses1787256400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "new_user_responses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "value" character varying, "is_custom" boolean NOT NULL DEFAULT false, "answer_text" character varying, "user_id" uuid NOT NULL, "question_id" uuid NOT NULL, "selection_id" uuid, "migraine_log_id" uuid, "preventive_treatment_id" uuid, CONSTRAINT "PK_new_user_responses_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_user_responses_user_id" ON "new_user_responses" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_user_responses_question_id" ON "new_user_responses" ("question_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_user_responses_selection_id" ON "new_user_responses" ("selection_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_user_responses_migraine_log_id" ON "new_user_responses" ("migraine_log_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_user_responses_preventive_treatment_id" ON "new_user_responses" ("preventive_treatment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_user_responses_user_question" ON "new_user_responses" ("user_id", "question_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "new_user_responses" ADD CONSTRAINT "FK_new_user_responses_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "new_user_responses" ADD CONSTRAINT "FK_new_user_responses_question_id" FOREIGN KEY ("question_id") REFERENCES "new_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "new_user_responses" ADD CONSTRAINT "FK_new_user_responses_selection_id" FOREIGN KEY ("selection_id") REFERENCES "new_selections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "new_user_responses" ADD CONSTRAINT "FK_new_user_responses_migraine_log_id" FOREIGN KEY ("migraine_log_id") REFERENCES "migraine_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "new_user_responses" ADD CONSTRAINT "FK_new_user_responses_preventive_treatment_id" FOREIGN KEY ("preventive_treatment_id") REFERENCES "preventive_treatments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "new_user_responses"`);
  }
}
