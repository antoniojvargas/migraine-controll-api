import { DeepPartial } from 'typeorm';
import { User } from '@/domain/user';
import { Profile } from '@/domain/profile';
import { requireNonEmpty, validateEmail } from '@/domain/validation';
import { ProfileEntity, UserEntity } from '@/infra/database/entities';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { CognitoPostSignUpInputDto } from '@/dto/cognito-post-sign-up-input.dto';
import { UseCaseInterface } from './usecase.interface';

export class CognitoPostSignUpUc implements UseCaseInterface<CognitoPostSignUpInputDto, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  execute = async (input: CognitoPostSignUpInputDto): Promise<void> => {
    const externalId = requireNonEmpty(input.externalId, 'externalId');
    const email = validateEmail(input.email);

    const linkedUser = await this.userRepository.findOneBy({ externalId });
    if (linkedUser !== null) {
      await this.applyEmailChangeIfNeeded(linkedUser, email);
      return;
    }

    const legacyUser = await this.userRepository.findOneBy({ email });
    if (legacyUser !== null) {
      await this.userRepository.update({ id: legacyUser.id }, { externalId });
      return;
    }

    const userId = await this.createUser(email, externalId);
    await this.createProfileIfComplete(userId, input);
  };

  private async applyEmailChangeIfNeeded(user: UserEntity, email: string): Promise<void> {
    if (user.email === email) {
      return;
    }
    await this.userRepository.update(
      { id: user.id },
      { email, originalEmail: user.email, emailChangedAt: new Date() },
    );
  }

  private async createUser(email: string, externalId: string): Promise<string> {
    const user = User.createNewUser({ email, externalId });
    const persisted = await this.userRepository.create({
      email: user.email,
      externalId: user.externalId,
      originalEmail: null,
    });
    return persisted.id;
  }

  private async createProfileIfComplete(
    userId: string,
    input: CognitoPostSignUpInputDto,
  ): Promise<void> {
    if (
      input.name === undefined ||
      input.gender === undefined ||
      input.birthDate === undefined ||
      input.geohash6 === undefined ||
      input.language === undefined
    ) {
      return;
    }

    const profile = Profile.createNewProfile({
      userId,
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      language: input.language,
      geohash6: input.geohash6,
    });
    const persisted = await this.profileRepository.create(this.mapProfileToEntity(profile));
    profile.assignId(persisted.id);
  }

  private mapProfileToEntity(profile: Profile): DeepPartial<ProfileEntity> {
    return {
      user: { id: profile.userId },
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      language: profile.language,
      geohash6: profile.geohash6,
      hasTakenSurvey: profile.hasTakenSurvey,
    };
  }
}
