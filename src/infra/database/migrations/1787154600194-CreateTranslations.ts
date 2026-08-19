import { MigrationInterface, QueryRunner } from 'typeorm';

const TRANSLATIONS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'translations'
`;

export class CreateTranslations1787154600194 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TRANSLATIONS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "translations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "language_code" character varying NOT NULL, "text" character varying NOT NULL, "selection_id" uuid NOT NULL, CONSTRAINT "PK_aca248c72ae1fb2390f1bf4cd87" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_743184500a0ba40bfb036fa619" ON "translations" ("selection_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8bfa0873b0f9dab88bcbccf10f" ON "translations" ("selection_id", "language_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "translations" ADD CONSTRAINT "FK_743184500a0ba40bfb036fa6194" FOREIGN KEY ("selection_id") REFERENCES "selections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(TRANSLATIONS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "translations"`);
  }
}
