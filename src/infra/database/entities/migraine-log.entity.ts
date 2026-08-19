import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { UserEntity } from './user.entity';
import { UserResponseEntity } from './user-response.entity';

@Entity('migraine_logs')
@Index(['user', 'startedAt'])
export class MigraineLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user!: UserEntity;

  @ManyToOne(() => SessionEntity, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  @Index()
  session!: SessionEntity | null;

  @Column({ type: 'int' })
  intensity!: number;

  @Column({ type: 'varchar', name: 'pain_location' })
  painLocation!: string;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt!: Date | null;

  @OneToMany(() => UserResponseEntity, (userResponse) => userResponse.migraineLog)
  userResponses!: UserResponseEntity[];
}
