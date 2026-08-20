import { Profile } from '@/domain/profile';
import { requireNonEmpty } from '@/domain/validation';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { ProfileEntity } from '@/infra/database/entities';
import { ProfileOutputDto } from '@/dto/profile-output.dto';

export abstract class ProfileBaseUc {
  constructor(protected readonly profileRepository: ProfileRepository) {}

  protected toEntityOutput(entity: ProfileEntity): ProfileOutputDto {
    return {
      id: entity.id,
      userId: entity.user.id,
      name: entity.name,
      gender: entity.gender,
      birthDate: entity.birthDate,
      language: entity.language,
      geohash6: entity.geohash6,
      appVersion: entity.appVersion,
      hasTakenSurvey: entity.hasTakenSurvey,
    };
  }

  protected toDomainOutput(profile: Profile): ProfileOutputDto {
    return {
      id: profile.id as string,
      userId: profile.userId,
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      language: profile.language,
      geohash6: profile.geohash6,
      appVersion: profile.appVersion,
      hasTakenSurvey: profile.hasTakenSurvey,
    };
  }

  protected async findByUserId(userId: string): Promise<ProfileOutputDto | null> {
    const entity = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.user_id = :userId', { userId })
      .getOne();
    return entity === null ? null : this.toEntityOutput(entity);
  }

  protected async findById(id: string): Promise<ProfileOutputDto | null> {
    const entity = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.id = :id', { id })
      .getOne();
    return entity === null ? null : this.toEntityOutput(entity);
  }

  protected validateId(id: string | undefined): string {
    return requireNonEmpty(id as string, 'id');
  }
}
