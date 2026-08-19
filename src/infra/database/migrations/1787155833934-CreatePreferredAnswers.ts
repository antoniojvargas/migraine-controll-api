import { MigrationInterface, QueryRunner } from 'typeorm';

const PREFERRED_ANSWERS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'preferred_answers'
`;

export class CreatePreferredAnswers1787155833934 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREFERRED_ANSWERS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "preferred_answers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "answer_text" character varying, "user_id" uuid NOT NULL, "question_id" uuid NOT NULL, "selection_id" uuid, CONSTRAINT "PK_e7cd373ae5a3ebfcfcfee98c062" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f5404602161014b407c7856be" ON "preferred_answers" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0aba8c4d108373b520d6fae8f1" ON "preferred_answers" ("question_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_788bce784b88ddeb3b5eeed470" ON "preferred_answers" ("selection_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_645d96b2beb6cbfea2c631037a" ON "preferred_answers" ("user_id", "question_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferred_answers" ADD CONSTRAINT "FK_7f5404602161014b407c7856bef" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferred_answers" ADD CONSTRAINT "FK_0aba8c4d108373b520d6fae8f15" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "preferred_answers" ADD CONSTRAINT "FK_788bce784b88ddeb3b5eeed470d" FOREIGN KEY ("selection_id") REFERENCES "selections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREFERRED_ANSWERS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "preferred_answers"`);
  }
}
