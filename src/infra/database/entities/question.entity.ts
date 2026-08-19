import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SelectionEntity } from './selection.entity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'int' })
  order!: number;

  @OneToMany(() => SelectionEntity, (selection) => selection.question)
  selections!: SelectionEntity[];
}
