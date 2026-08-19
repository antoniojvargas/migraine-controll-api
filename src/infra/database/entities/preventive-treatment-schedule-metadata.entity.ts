import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PreventiveTreatmentScheduleEntity } from './preventive-treatment-schedule.entity';

@Entity('preventive_treatment_schedule_metadata')
export class PreventiveTreatmentScheduleMetadataEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PreventiveTreatmentScheduleEntity, { nullable: false })
  @JoinColumn({ name: 'preventive_treatment_schedule_id' })
  @Index()
  schedule!: PreventiveTreatmentScheduleEntity;

  @Column({ type: 'varchar', default: 'pending' })
  status!: string;

  @Column({ type: 'timestamptz', name: 'reminded_at', nullable: true })
  remindedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'logged_at', nullable: true })
  loggedAt!: Date | null;
}
