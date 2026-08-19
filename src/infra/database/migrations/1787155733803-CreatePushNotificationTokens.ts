import { MigrationInterface, QueryRunner } from 'typeorm';

const PUSH_NOTIFICATION_TOKENS_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'push_notification_tokens'
`;

export class CreatePushNotificationTokens1787155733803 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PUSH_NOTIFICATION_TOKENS_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "push_notification_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "token" character varying NOT NULL, "channel" character varying NOT NULL, "app_version" character varying, "phone_manufacturer" character varying, "phone_os_name" character varying, "phone_os_version" character varying, "user_id" uuid NOT NULL, CONSTRAINT "PK_4de2b58cd3b6d25024b8dec62e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_003883effff7e9e99c9c730c3d" ON "push_notification_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_910b143d70e5050ef4ca4f29c4" ON "push_notification_tokens" ("user_id", "token")`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_notification_tokens" ADD CONSTRAINT "FK_003883effff7e9e99c9c730c3d3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(PUSH_NOTIFICATION_TOKENS_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "push_notification_tokens"`);
  }
}
