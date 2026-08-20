import { MigrationInterface, QueryRunner } from 'typeorm';

const APP_VERSION_NULLABLE_CHECK = `
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name = 'app_version' AND is_nullable = 'YES'
`;

export class MakeProfilesAppVersionNullable1787254974438 implements MigrationInterface {
  name = 'MakeProfilesAppVersionNullable1787254974438';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const alreadyNullable = await queryRunner.query(APP_VERSION_NULLABLE_CHECK);
    if (alreadyNullable.length > 0) {
      return;
    }

    await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "app_version" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const alreadyNullable = await queryRunner.query(APP_VERSION_NULLABLE_CHECK);
    if (alreadyNullable.length === 0) {
      return;
    }

    await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "app_version" SET NOT NULL`);
  }
}
