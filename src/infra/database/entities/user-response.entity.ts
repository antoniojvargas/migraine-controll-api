import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionEntity } from './question.entity';
import { SelectionEntity } from './selection.entity';
import { UserEntity } from './user.entity';

@Entity('user_responses')
export class UserResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user!: UserEntity;

  @ManyToOne(() => QuestionEntity, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  @Index()
  question!: QuestionEntity;

  @ManyToOne(() => SelectionEntity, { nullable: true })
  @JoinColumn({ name: 'selection_id' })
  @Index()
  selection!: SelectionEntity | null;

  @Column({ type: 'varchar', name: 'answer_text', nullable: true })
  answerText!: string | null;

  @Column({ type: 'uuid', name: 'migraine_log_id', nullable: true })
  @Index()
  migraineLogId!: string | null;

  @Column({ type: 'uuid', name: 'preventive_treatment_id', nullable: true })
  @Index()
  preventiveTreatmentId!: string | null;
}
