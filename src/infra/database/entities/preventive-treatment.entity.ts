import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PreventiveTreatmentScheduleEntity } from './preventive-treatment-schedule.entity';
import { UserEntity } from './user.entity';

@Entity('preventive_treatments')
export class PreventiveTreatmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user!: UserEntity;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'boolean', name: 'is_recurrent', default: false })
  isRecurrent!: boolean;

  @Column({ type: 'date', name: 'repeat_until', nullable: true })
  repeatUntil!: Date | null;

  @OneToMany(() => PreventiveTreatmentScheduleEntity, (schedule) => schedule.treatment)
  schedules!: PreventiveTreatmentScheduleEntity[];
}
