import { CognitoPostSignInInputDto } from '@/dto/cognito-post-sign-in-input.dto';
import { UseCaseInterface } from './usecase.interface';
import { CognitoPostSignUpUc } from './cognito-post-sign-up.uc';

const SIGN_IN_WITH_APPLE_PROVIDER = 'SignInWithApple';

export class CognitoPostSignInUc implements UseCaseInterface<CognitoPostSignInInputDto, void> {
  constructor(private readonly cognitoPostSignUpUc: CognitoPostSignUpUc) {}

  execute = async (input: CognitoPostSignInInputDto): Promise<void> => {
    if (!this.isSignInWithApple(input.identities)) {
      return;
    }

    await this.cognitoPostSignUpUc.execute({
      externalId: input.externalId,
      email: input.email,
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      geohash6: input.geohash6,
      language: input.language,
    });
  };

  private isSignInWithApple(identities: string | undefined): boolean {
    return identities !== undefined && identities.includes(SIGN_IN_WITH_APPLE_PROVIDER);
  }
}
