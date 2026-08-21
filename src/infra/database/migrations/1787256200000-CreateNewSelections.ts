import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'new_selections'
`;

export class CreateNewSelections1787256200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "new_selections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "key" character varying NOT NULL, "order" integer NOT NULL, "value" character varying, "is_custom" boolean NOT NULL DEFAULT false, "question_id" uuid NOT NULL, CONSTRAINT "UQ_new_selections_key" UNIQUE ("key"), CONSTRAINT "PK_new_selections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_selections_question_id" ON "new_selections" ("question_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "new_selections" ADD CONSTRAINT "FK_new_selections_question_id" FOREIGN KEY ("question_id") REFERENCES "new_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "new_selections"`);
  }
}
