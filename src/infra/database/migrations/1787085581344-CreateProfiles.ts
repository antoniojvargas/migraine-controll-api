import { MigrationInterface, QueryRunner } from 'typeorm';

const PROFILES_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'profiles'
`;

export class CreateProfiles1787085581344 implements MigrationInterface {
  name = 'CreateProfiles1787085581344';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PROFILES_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "gender" character varying NOT NULL, "birth_date" date NOT NULL, "language" character varying NOT NULL, "geohash6" character varying(6) NOT NULL, "app_version" character varying NOT NULL, "has_taken_survey" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, CONSTRAINT "REL_9e432b7df0d182f8d292902d1a" UNIQUE ("user_id"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PROFILES_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2"`,
    );
    await queryRunner.query(`DROP TABLE "profiles"`);
  }
}
