import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_daily_vitals')
@Index(['user', 'dateLocal'], { unique: true })
export class UserDailyVitalsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'date', name: 'date_local' })
  @Index()
  dateLocal!: string;

  @Column({ type: 'int', name: 'sleep_duration_minutes', nullable: true })
  sleepDurationMinutes!: number | null;

  @Column({ type: 'numeric', name: 'sleep_score', nullable: true })
  sleepScore!: number | null;

  @Column({ type: 'int', nullable: true })
  steps!: number | null;

  @Column({ type: 'int', name: 'calories_burned', nullable: true })
  caloriesBurned!: number | null;

  @Column({ type: 'numeric', name: 'resting_heart_rate', nullable: true })
  restingHeartRate!: number | null;

  @CreateDateColumn({ name: 'computed_at', type: 'timestamptz' })
  computedAt!: Date;
}
