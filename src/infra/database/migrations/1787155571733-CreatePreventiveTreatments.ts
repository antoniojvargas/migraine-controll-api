import { MigrationInterface, QueryRunner } from 'typeorm';

const PREVENTIVE_TREATMENTS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'preventive_treatments'
`;

export class CreatePreventiveTreatments1787155571733 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREVENTIVE_TREATMENTS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "preventive_treatments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "is_recurrent" boolean NOT NULL DEFAULT false, "repeat_until" date, "user_id" uuid NOT NULL, CONSTRAINT "PK_ad196a78f512428aff15229f3e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88807620d7c29c0dfb225f4abd" ON "preventive_treatments" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "preventive_treatments" ADD CONSTRAINT "FK_88807620d7c29c0dfb225f4abd1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PREVENTIVE_TREATMENTS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "preventive_treatments"`);
  }
}
