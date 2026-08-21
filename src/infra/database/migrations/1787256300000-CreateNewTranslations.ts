import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'new_translations'
`;

export class CreateNewTranslations1787256300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "new_translations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "language_code" character varying NOT NULL, "text" character varying NOT NULL, "selection_id" uuid NOT NULL, CONSTRAINT "PK_new_translations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_new_translations_selection_id" ON "new_translations" ("selection_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_new_translations_selection_language" ON "new_translations" ("selection_id", "language_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "new_translations" ADD CONSTRAINT "FK_new_translations_selection_id" FOREIGN KEY ("selection_id") REFERENCES "new_selections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "new_translations"`);
  }
}
