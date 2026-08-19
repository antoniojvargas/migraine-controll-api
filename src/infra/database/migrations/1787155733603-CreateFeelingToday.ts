import { MigrationInterface, QueryRunner } from 'typeorm';

const FEELING_TODAY_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'feeling_today'
`;

export class CreateFeelingToday1787155733603 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(FEELING_TODAY_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "feeling_today" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "feeling" character varying NOT NULL, "felt_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_4cf0a4221044a96986d90c485f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d357c258e6b6246d733b24af6" ON "feeling_today" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "feeling_today" ADD CONSTRAINT "FK_3d357c258e6b6246d733b24af63" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(FEELING_TODAY_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "feeling_today"`);
  }
}
