import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DeviceEntity, { nullable: false })
  @JoinColumn({ name: 'device_id' })
  @Index()
  device!: DeviceEntity;

  @Column({ type: 'varchar', name: 'prog_selected' })
  progSelected!: string;

  @Column({ type: 'int' })
  duration!: number;

  @Column({ type: 'int', name: 'max_intensity' })
  maxIntensity!: number;

  @Column({ type: 'int', name: 'battery_level' })
  batteryLevel!: number;

  @Column({ type: 'float', nullable: true })
  latitude!: number | null;

  @Column({ type: 'float', nullable: true })
  longitude!: number | null;

  @Column({ type: 'varchar', name: 'app_version', nullable: true })
  appVersion!: string | null;

  @Column({ type: 'varchar', name: 'phone_manufacturer', nullable: true })
  phoneManufacturer!: string | null;

  @Column({ type: 'varchar', name: 'phone_os_name', nullable: true })
  phoneOsName!: string | null;

  @Column({ type: 'varchar', name: 'phone_os_version', nullable: true })
  phoneOsVersion!: string | null;

  @Column({ type: 'uuid', name: 'treatment_id', nullable: true })
  @Index()
  treatmentId!: string | null;
}
