import { MigrationInterface, QueryRunner } from 'typeorm';

const WEATHER_TILES_TABLE_CHECK = `
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'weather_tiles'
`;

export class CreateWeatherTiles1787400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(WEATHER_TILES_TABLE_CHECK);
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "weather_tiles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "geohash6" character varying(6) NOT NULL, "history_ingested_at" TIMESTAMP WITH TIME ZONE, "forecast_ingested_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e12b0e4dab3b0f2a3ec99a01bc1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a4a9a1a6e6b0f6f8fbb5f9d2c11" ON "weather_tiles" ("geohash6")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(WEATHER_TILES_TABLE_CHECK);
    if (tableExists.length === 0) {
      return;
    }

    await queryRunner.query(`DROP TABLE "weather_tiles"`);
  }
}
