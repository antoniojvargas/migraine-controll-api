import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1787156289087 implements MigrationInterface {
  name = 'AddPerformanceIndexes1787156289087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dc867fce16af95cce8049e26cb" ON "preventive_treatment_schedules" ("preventive_treatment_id", "scheduled_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_15fbb5ec29f17772cc94c65ee0" ON "user_responses" ("user_id", "question_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_26d6fb37a69314b8fecd97a240" ON "migraine_logs" ("user_id", "started_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_26d6fb37a69314b8fecd97a240"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_15fbb5ec29f17772cc94c65ee0"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_dc867fce16af95cce8049e26cb"`);
  }
}
