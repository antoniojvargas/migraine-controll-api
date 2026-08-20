import { CreateMigraineLogDto } from './create-migraine-log.dto';
import { CreateUserResponsesInputDto } from './create-user-responses-input.dto';

export interface CreateMigraineLogInputDto extends CreateMigraineLogDto {
  responses?: CreateUserResponsesInputDto['responses'];
}
