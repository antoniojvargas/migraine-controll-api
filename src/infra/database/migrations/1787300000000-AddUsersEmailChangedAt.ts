import { MigrationInterface, QueryRunner } from 'typeorm';

const EMAIL_CHANGED_AT_CHECK = `
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name = 'email_changed_at'
`;

export class AddUsersEmailChangedAt1787300000000 implements MigrationInterface {
  name = 'AddUsersEmailChangedAt1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(EMAIL_CHANGED_AT_CHECK);
    if (columnExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "email_changed_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(EMAIL_CHANGED_AT_CHECK);
    if (columnExists.length === 0) {
      return;
    }

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_changed_at"`);
  }
}
