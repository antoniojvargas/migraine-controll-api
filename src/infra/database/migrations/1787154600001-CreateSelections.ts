import { MigrationInterface, QueryRunner } from 'typeorm';

const SELECTIONS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'selections'
`;

export class CreateSelections1787154600001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(SELECTIONS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "selections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "key" character varying NOT NULL, "order" integer NOT NULL, "question_id" uuid NOT NULL, CONSTRAINT "UQ_0c5ca32cc6c07edc1cde855203a" UNIQUE ("key"), CONSTRAINT "PK_ca8c40db57a61d47e4f5fbbf04e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88e55a5aa8a7b04977b5529d5d" ON "selections" ("question_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "selections" ADD CONSTRAINT "FK_88e55a5aa8a7b04977b5529d5df" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(SELECTIONS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "selections"`);
  }
}
