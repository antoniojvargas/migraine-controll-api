import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('push_notification_tokens')
@Index(['user', 'token'], { unique: true })
export class PushNotificationTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user!: UserEntity;

  @Column({ type: 'varchar' })
  token!: string;

  @Column({ type: 'varchar' })
  channel!: string;

  @Column({ type: 'varchar', name: 'app_version', nullable: true })
  appVersion!: string | null;

  @Column({ type: 'varchar', name: 'phone_manufacturer', nullable: true })
  phoneManufacturer!: string | null;

  @Column({ type: 'varchar', name: 'phone_os_name', nullable: true })
  phoneOsName!: string | null;

  @Column({ type: 'varchar', name: 'phone_os_version', nullable: true })
  phoneOsVersion!: string | null;
}
