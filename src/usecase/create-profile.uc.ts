import { DeepPartial } from 'typeorm';
import { Profile } from '@/domain/profile';
import { requireNonEmpty } from '@/domain/validation';
import { ProfileEntity } from '@/infra/database/entities';
import { CreateProfileDto } from '@/dto/create-profile.dto';
import { ProfileOutputDto } from '@/dto/profile-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { ProfileBaseUc } from './profile-base.uc';

export class CreateProfileUc
  extends ProfileBaseUc
  implements UseCaseInterface<CreateProfileDto, ProfileOutputDto>
{
  execute = async (input: CreateProfileDto): Promise<ProfileOutputDto> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const existing = await this.findByUserId(userId);
      if (existing !== null) {
        return existing;
      }
      const profile = Profile.createNewProfile(input);
      const persisted = await this.profileRepository.create(this.mapToEntity(profile));
      profile.assignId(persisted.id);
      return this.toDomainOutput(profile);
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private mapToEntity(profile: Profile): DeepPartial<ProfileEntity> {
    return {
      user: { id: profile.userId },
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      language: profile.language,
      geohash6: profile.geohash6,
      appVersion: profile.appVersion,
      hasTakenSurvey: profile.hasTakenSurvey,
    };
  }
}
