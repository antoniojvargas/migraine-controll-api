import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  gender!: string;

  @Column({ type: 'date', name: 'birth_date' })
  birthDate!: Date;

  @Column({ type: 'varchar' })
  language!: string;

  @Column({ type: 'varchar', length: 6, name: 'geohash6' })
  geohash6!: string;

  @Column({ type: 'varchar', name: 'app_version', nullable: true })
  appVersion!: string | null;

  @Column({ type: 'boolean', name: 'has_taken_survey', default: false })
  hasTakenSurvey!: boolean;
}
