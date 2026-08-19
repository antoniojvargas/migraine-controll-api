import { MigrationInterface, QueryRunner } from 'typeorm';

const USER_RESPONSES_MIGRAINE_LOG_FK_CHECK = `
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND table_name = 'user_responses'
    AND constraint_name = 'FK_bb53af87435b921089fe7367573'
`;

export class AddUserResponsesMigraineLogFk1787155268874 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const fkExists = await queryRunner.query(USER_RESPONSES_MIGRAINE_LOG_FK_CHECK);
    if (fkExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "user_responses" ADD CONSTRAINT "FK_bb53af87435b921089fe7367573" FOREIGN KEY ("migraine_log_id") REFERENCES "migraine_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fkExists = await queryRunner.query(USER_RESPONSES_MIGRAINE_LOG_FK_CHECK);
    if (fkExists.length === 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "user_responses" DROP CONSTRAINT "FK_bb53af87435b921089fe7367573"`,
    );
  }
}
