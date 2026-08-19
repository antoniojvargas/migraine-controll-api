import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PreventiveTreatmentEntity } from './preventive-treatment.entity';

@Entity('preventive_treatment_schedules')
export class PreventiveTreatmentScheduleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PreventiveTreatmentEntity, (treatment) => treatment.schedules, {
    nullable: false,
  })
  @JoinColumn({ name: 'preventive_treatment_id' })
  @Index()
  treatment!: PreventiveTreatmentEntity;

  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({ type: 'int', name: 'reminder_before_log', nullable: true })
  reminderBeforeLog!: number | null;
}
