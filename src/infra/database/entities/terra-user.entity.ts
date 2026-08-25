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

@Entity('terra_users')
export class TerraUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user!: UserEntity;

  @Column({ type: 'varchar', name: 'terra_user_id' })
  @Index({ unique: true })
  terraUserId!: string;

  @Column({ type: 'varchar' })
  provider!: string;

  @Column({ type: 'varchar', nullable: true })
  scopes!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'timestamptz', name: 'last_webhook_at', nullable: true })
  lastWebhookAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
