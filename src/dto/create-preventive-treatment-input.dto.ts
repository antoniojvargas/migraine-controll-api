import { CreatePreventiveTreatmentDto } from './create-preventive-treatment.dto';
import { CreateUserResponsesInputDto } from './create-user-responses-input.dto';

export interface CreatePreventiveTreatmentInputDto extends CreatePreventiveTreatmentDto {
  responses?: CreateUserResponsesInputDto['responses'];
}
