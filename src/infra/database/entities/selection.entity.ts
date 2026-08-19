import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionEntity } from './question.entity';
import { TranslationEntity } from './translation.entity';

@Entity('selections')
export class SelectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ type: 'int' })
  order!: number;

  @ManyToOne(() => QuestionEntity, (question) => question.selections, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  @Index()
  question!: QuestionEntity;

  @OneToMany(() => TranslationEntity, (translation) => translation.selection)
  translations!: TranslationEntity[];
}
