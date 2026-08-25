import { MigrationInterface, QueryRunner } from 'typeorm';

const COLUMN_CHECK = `
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'weather_tiles' AND column_name = 'observed_at'
`;

export class AddWeatherTileReadings1787500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(COLUMN_CHECK);
    if (columnExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "weather_tiles"
        ADD COLUMN "observed_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN "temperature_celsius" double precision,
        ADD COLUMN "humidity_percent" double precision,
        ADD COLUMN "pressure_hpa" double precision,
        ADD COLUMN "weather_code" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(COLUMN_CHECK);
    if (columnExists.length === 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "weather_tiles"
        DROP COLUMN "observed_at",
        DROP COLUMN "temperature_celsius",
        DROP COLUMN "humidity_percent",
        DROP COLUMN "pressure_hpa",
        DROP COLUMN "weather_code"`,
    );
  }
}
