import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AcuteTreatmentWorseFeedbackOptionsEntity } from './acute-treatment-worse-feedback-options.entity';
import { UserResponseEntity } from './user-response.entity';

@Entity('user_response_acute_treatment_worse_feedback_options')
@Index(['userResponse', 'option'], { unique: true })
export class UserResponseAcuteTreatmentWorseFeedbackOptionsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserResponseEntity, { nullable: false })
  @JoinColumn({ name: 'user_response_id' })
  @Index()
  userResponse!: UserResponseEntity;

  @ManyToOne(() => AcuteTreatmentWorseFeedbackOptionsEntity, { nullable: false })
  @JoinColumn({ name: 'acute_treatment_worse_feedback_option_id' })
  @Index()
  option!: AcuteTreatmentWorseFeedbackOptionsEntity;
}
