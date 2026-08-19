import { MigrationInterface, QueryRunner } from 'typeorm';

const USER_RESPONSES_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'user_responses'
`;

export class CreateUserResponses1787154948022 implements MigrationInterface {
  name = 'CreateUserResponses1787154948022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(USER_RESPONSES_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "user_responses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "answer_text" character varying, "migraine_log_id" uuid, "preventive_treatment_id" uuid, "user_id" uuid NOT NULL, "question_id" uuid NOT NULL, "selection_id" uuid, CONSTRAINT "PK_95f8e565fdbfff567f2b2f70417" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a078a40beb1d6482c4490fcce3" ON "user_responses" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1a9e2753d833346f8ab873575" ON "user_responses" ("question_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_872042646eb400a905b54d4fee" ON "user_responses" ("selection_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb53af87435b921089fe736757" ON "user_responses" ("migraine_log_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55733ee2f7876501b7f2a53aff" ON "user_responses" ("preventive_treatment_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_responses" ADD CONSTRAINT "FK_a078a40beb1d6482c4490fcce31" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_responses" ADD CONSTRAINT "FK_b1a9e2753d833346f8ab8735751" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_responses" ADD CONSTRAINT "FK_872042646eb400a905b54d4fee0" FOREIGN KEY ("selection_id") REFERENCES "selections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(USER_RESPONSES_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "user_responses"`);
  }
}
