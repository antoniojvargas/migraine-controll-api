import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('app_versions')
export class AppVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  platform!: string;

  @Column({ type: 'varchar' })
  version!: string;

  @Column({ type: 'boolean', name: 'force_update', default: false })
  forceUpdate!: boolean;

  @Column({ type: 'boolean', default: false })
  announcement!: boolean;
}
