import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MigraineLogEntity } from './migraine-log.entity';
import { NewQuestionEntity } from './new-question.entity';
import { NewSelectionEntity } from './new-selection.entity';
import { PreventiveTreatmentEntity } from './preventive-treatment.entity';
import { UserEntity } from './user.entity';

@Entity('new_user_responses')
@Index(['user', 'question'])
export class NewUserResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user!: UserEntity;

  @ManyToOne(() => NewQuestionEntity, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  @Index()
  question!: NewQuestionEntity;

  @ManyToOne(() => NewSelectionEntity, { nullable: true })
  @JoinColumn({ name: 'selection_id' })
  @Index()
  selection!: NewSelectionEntity | null;

  @Column({ type: 'varchar', nullable: true })
  value!: string | null;

  @Column({ type: 'boolean', name: 'is_custom', default: false })
  isCustom!: boolean;

  @Column({ type: 'varchar', name: 'answer_text', nullable: true })
  answerText!: string | null;

  @ManyToOne(() => MigraineLogEntity, { nullable: true })
  @JoinColumn({ name: 'migraine_log_id' })
  @Index()
  migraineLog!: MigraineLogEntity | null;

  @ManyToOne(() => PreventiveTreatmentEntity, { nullable: true })
  @JoinColumn({ name: 'preventive_treatment_id' })
  @Index()
  preventiveTreatment!: PreventiveTreatmentEntity | null;
}
