import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('terra_webhook_logs')
export class TerraWebhookLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'terra_user_id', nullable: true })
  @Index()
  terraUserId!: string | null;

  @Column({ type: 'varchar', name: 'event_type' })
  eventType!: string;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'varchar', name: 's3_raw_payload_key', nullable: true })
  s3RawPayloadKey!: string | null;

  @Column({ type: 'varchar', name: 'error_message', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'timestamptz', name: 'received_at', default: () => 'now()' })
  @Index()
  receivedAt!: Date;
}
