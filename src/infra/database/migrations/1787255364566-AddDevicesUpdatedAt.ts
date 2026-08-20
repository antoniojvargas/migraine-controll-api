import { MigrationInterface, QueryRunner } from 'typeorm';

const UPDATED_AT_CHECK = `
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'devices'
    AND column_name = 'updated_at'
`;

export class AddDevicesUpdatedAt1787255364566 implements MigrationInterface {
  name = 'AddDevicesUpdatedAt1787255364566';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(UPDATED_AT_CHECK);
    if (columnExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "devices" ADD COLUMN "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(UPDATED_AT_CHECK);
    if (columnExists.length === 0) {
      return;
    }

    await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "updated_at"`);
  }
}
