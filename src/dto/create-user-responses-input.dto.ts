import { CreateUserResponseInputDto } from './create-user-response-input.dto';

export interface CreateUserResponsesInputDto {
  userId: string;
  responses: Omit<
    CreateUserResponseInputDto,
    'userId' | 'migraineLogId' | 'preventiveTreatmentId'
  >[];
  migraineLogId?: string | null;
  preventiveTreatmentId?: string | null;
}
