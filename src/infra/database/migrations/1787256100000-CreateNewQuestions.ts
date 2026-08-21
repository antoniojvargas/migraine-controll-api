import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'new_questions'
`;

export class CreateNewQuestions1787256100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "new_questions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "key" character varying NOT NULL, "type" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "UQ_new_questions_key" UNIQUE ("key"), CONSTRAINT "PK_new_questions_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "new_questions"`);
  }
}
