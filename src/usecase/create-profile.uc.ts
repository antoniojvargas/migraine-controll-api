import { DeepPartial } from 'typeorm';
import { Profile } from '@/domain/profile';
import { DomainError } from '@/domain/domain-error';
import { requireNonEmpty } from '@/domain/validation';
import { ProfileEntity } from '@/infra/database/entities';
import { CreateProfileDto } from '@/dto/create-profile.dto';
import { ProfileOutputDto } from '@/dto/profile-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { encodeGeohash6 } from '@/utils/geohash';
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
      const geohash6 = input.geohash6 ?? this.resolveGeohash6FromCoordinates(input);
      const profile = Profile.createNewProfile({ ...input, geohash6 });
      const persisted = await this.profileRepository.create(this.mapToEntity(profile));
      profile.assignId(persisted.id);
      return this.toDomainOutput(profile);
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private resolveGeohash6FromCoordinates(input: CreateProfileDto): string {
    if (input.latitude === undefined || input.longitude === undefined) {
      throw new DomainError('geohash6 or latitude/longitude are required');
    }
    return encodeGeohash6(input.latitude, input.longitude);
  }

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
