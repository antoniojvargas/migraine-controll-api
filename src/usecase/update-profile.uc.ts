import { DeepPartial } from 'typeorm';
import { Profile } from '@/domain/profile';
import { requireNonEmpty } from '@/domain/validation';
import { ProfileEntity } from '@/infra/database/entities';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { UpdateProfileInputDto } from '@/dto/update-profile-input.dto';
import { ProfileOutputDto } from '@/dto/profile-output.dto';
import { AppError } from '@/utils/app-error';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { ProfileBaseUc } from './profile-base.uc';
import { CognitoUpdateUserAttributesUc } from './cognito-update-user-attributes.uc';

export class UpdateProfileUc
  extends ProfileBaseUc
  implements UseCaseInterface<UpdateProfileInputDto, ProfileOutputDto>
{
  constructor(
    profileRepository: ProfileRepository,
    private readonly cognitoUpdateUserAttributesUc: CognitoUpdateUserAttributesUc,
  ) {
    super(profileRepository);
  }

  execute = async (input: UpdateProfileInputDto): Promise<ProfileOutputDto> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const entity = await this.findEntityByUserId(userId);
      if (entity === null) {
        throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found');
      }

      const profile = this.toDomainProfile(entity);
      profile.updateProfile(input);
      await this.profileRepository.update({ id: entity.id }, this.mapToEntity(profile));

      await this.cognitoUpdateUserAttributesUc.execute({
        externalId: entity.user.externalId,
        name: input.name,
        gender: input.gender,
        birthDate: input.birthDate === undefined ? undefined : this.toIsoDate(profile.birthDate),
      });

      return this.toDomainOutput(profile);
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private toDomainProfile(entity: ProfileEntity): Profile {
    const profile = Profile.createNewProfile({
      userId: entity.user.id,
      name: entity.name,
      gender: entity.gender,
      birthDate: entity.birthDate,
      language: entity.language,
      geohash6: entity.geohash6,
      appVersion: entity.appVersion ?? undefined,
      hasTakenSurvey: entity.hasTakenSurvey,
    });
    profile.assignId(entity.id);
    return profile;
  }

  private mapToEntity(profile: Profile): DeepPartial<ProfileEntity> {
    return {
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      language: profile.language,
      geohash6: profile.geohash6,
      appVersion: profile.appVersion,
      hasTakenSurvey: profile.hasTakenSurvey,
    };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
