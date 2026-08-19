import { MigrationInterface, QueryRunner } from 'typeorm';

const QUESTIONS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'questions'
`;

export class CreateQuestions1787154599805 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(QUESTIONS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "key" character varying NOT NULL, "type" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "UQ_34481659a095bfc757507110432" UNIQUE ("key"), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(QUESTIONS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "questions"`);
  }
}
