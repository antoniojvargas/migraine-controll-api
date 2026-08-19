import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MigraineLogEntity } from './migraine-log.entity';
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

  @ManyToOne(() => MigraineLogEntity, (migraineLog) => migraineLog.userResponses, {
    nullable: true,
  })
  @JoinColumn({ name: 'migraine_log_id' })
  @Index()
  migraineLog!: MigraineLogEntity | null;

  @Column({ type: 'uuid', name: 'preventive_treatment_id', nullable: true })
  @Index()
  preventiveTreatmentId!: string | null;
}
