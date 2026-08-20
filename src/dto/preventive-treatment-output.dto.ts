import { UserResponseOutputDto } from './user-response-output.dto';

export interface PreventiveTreatmentOutputDto {
  id: string;
  userId: string;
  name: string;
  isRecurrent: boolean;
  repeatUntil: Date | null;
  responses: UserResponseOutputDto[];
}
