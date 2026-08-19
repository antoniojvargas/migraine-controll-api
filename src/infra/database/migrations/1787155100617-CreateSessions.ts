import { MigrationInterface, QueryRunner } from 'typeorm';

const SESSIONS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'sessions'
`;

export class CreateSessions1787155100617 implements MigrationInterface {
  name = 'CreateSessions1787155100617';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(SESSIONS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "prog_selected" character varying NOT NULL, "duration" integer NOT NULL, "max_intensity" integer NOT NULL, "battery_level" integer NOT NULL, "latitude" double precision, "longitude" double precision, "app_version" character varying, "phone_manufacturer" character varying, "phone_os_name" character varying, "phone_os_version" character varying, "treatment_id" uuid, "device_id" uuid NOT NULL, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97207844c19e5c27d33a07f67c" ON "sessions" ("device_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05a1023cf7c92bfe234823b19a" ON "sessions" ("treatment_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_97207844c19e5c27d33a07f67c0" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(SESSIONS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
