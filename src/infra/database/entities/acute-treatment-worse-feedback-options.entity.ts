import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('acute_treatment_worse_feedback_options')
export class AcuteTreatmentWorseFeedbackOptionsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ type: 'varchar' })
  text!: string;
}
