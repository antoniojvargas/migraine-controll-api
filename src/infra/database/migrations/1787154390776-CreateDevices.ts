import { MigrationInterface, QueryRunner } from 'typeorm';

const DEVICES_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'devices'
`;

export class CreateDevices1787154390776 implements MigrationInterface {
  name = 'CreateDevices1787154390776';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(DEVICES_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "status" character varying NOT NULL, "app_version" character varying, "phone_manufacturer" character varying, "phone_os_name" character varying, "phone_os_version" character varying, "profile_id" uuid NOT NULL, CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce2f6aae21a627446c9f9a9611" ON "devices" ("profile_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_ce2f6aae21a627446c9f9a96117" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(DEVICES_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_ce2f6aae21a627446c9f9a96117"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ce2f6aae21a627446c9f9a9611"`);
    await queryRunner.query(`DROP TABLE "devices"`);
  }
}
