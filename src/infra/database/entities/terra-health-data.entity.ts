import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TerraUserEntity } from './terra-user.entity';

@Entity('terra_health_data')
@Index(['terraUser', 'periodStart'])
export class TerraHealthDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TerraUserEntity, { nullable: false })
  @JoinColumn({ name: 'terra_user_id' })
  @Index()
  terraUser!: TerraUserEntity;

  @Column({ type: 'varchar', name: 'data_type' })
  dataType!: string;

  @Column({ type: 'timestamptz', name: 'period_start' })
  periodStart!: Date;

  @Column({ type: 'timestamptz', name: 'period_end' })
  periodEnd!: Date;

  @Column({ type: 'jsonb' })
  data!: unknown;

  @Column({ type: 'varchar', name: 's3_raw_payload_key', nullable: true })
  s3RawPayloadKey!: string | null;

  @CreateDateColumn({ name: 'ingested_at', type: 'timestamptz' })
  ingestedAt!: Date;
}
