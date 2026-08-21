import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { NewSelectionEntity } from './new-selection.entity';

@Entity('new_questions')
export class NewQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'int' })
  order!: number;

  @OneToMany(() => NewSelectionEntity, (selection) => selection.question)
  selections!: NewSelectionEntity[];
}
