import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NewQuestionEntity } from './new-question.entity';
import { NewTranslationEntity } from './new-translation.entity';

@Entity('new_selections')
export class NewSelectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ type: 'int' })
  order!: number;

  @Column({ type: 'varchar', nullable: true })
  value!: string | null;

  @Column({ type: 'boolean', name: 'is_custom', default: false })
  isCustom!: boolean;

  @ManyToOne(() => NewQuestionEntity, (question) => question.selections, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  @Index()
  question!: NewQuestionEntity;

  @OneToMany(() => NewTranslationEntity, (translation) => translation.selection)
  translations!: NewTranslationEntity[];
}
