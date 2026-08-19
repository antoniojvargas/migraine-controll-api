import { MigrationInterface, QueryRunner } from 'typeorm';

const USER_RESPONSES_PREVENTIVE_TREATMENT_FK_CHECK = `
  SELECT 1 FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND table_name = 'user_responses'
    AND constraint_name = 'FK_55733ee2f7876501b7f2a53afff'
`;

export class AddUserResponsesPreventiveTreatmentFk1787155572116 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const fkExists = await queryRunner.query(USER_RESPONSES_PREVENTIVE_TREATMENT_FK_CHECK);
    if (fkExists.length > 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "user_responses" ADD CONSTRAINT "FK_55733ee2f7876501b7f2a53afff" FOREIGN KEY ("preventive_treatment_id") REFERENCES "preventive_treatments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fkExists = await queryRunner.query(USER_RESPONSES_PREVENTIVE_TREATMENT_FK_CHECK);
    if (fkExists.length === 0) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "user_responses" DROP CONSTRAINT "FK_55733ee2f7876501b7f2a53afff"`,
    );
  }
}
