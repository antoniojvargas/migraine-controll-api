import { UpdateProfileDto } from './update-profile.dto';

export interface UpdateProfileInputDto extends UpdateProfileDto {
  userId: string;
}
