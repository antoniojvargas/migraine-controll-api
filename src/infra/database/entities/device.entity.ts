import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProfileEntity } from './profile.entity';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ProfileEntity, { nullable: false })
  @JoinColumn({ name: 'profile_id' })
  @Index()
  profile!: ProfileEntity;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'varchar', name: 'app_version', nullable: true })
  appVersion!: string | null;

  @Column({ type: 'varchar', name: 'phone_manufacturer', nullable: true })
  phoneManufacturer!: string | null;

  @Column({ type: 'varchar', name: 'phone_os_name', nullable: true })
  phoneOsName!: string | null;

  @Column({ type: 'varchar', name: 'phone_os_version', nullable: true })
  phoneOsVersion!: string | null;
}
