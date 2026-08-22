import { CognitoDeleteUserInputDto } from '@/dto/cognito-delete-user-input.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { CognitoUserDirectoryPort, CognitoUserRecord } from './ports/cognito-user-directory.port';
import { UseCaseInterface } from './usecase.interface';
import { UserBaseUc } from './user-base.uc';

const SIGN_IN_WITH_APPLE_PROVIDER = 'SignInWithApple';

export class CognitoDeleteUserUc
  extends UserBaseUc
  implements UseCaseInterface<CognitoDeleteUserInputDto, void>
{
  constructor(
    userRepository: UserRepository,
    private readonly cognitoUserDirectory: CognitoUserDirectoryPort,
  ) {
    super(userRepository);
  }

  execute = async (input: CognitoDeleteUserInputDto): Promise<void> => {
    try {
      const id = this.validateId(input.id);
      const user = await this.getDomainUser(id);

      const cognitoUser = await this.resolveCognitoUser(user.externalId, user.email);
      if (cognitoUser !== null) {
        await this.deleteOrTombstone(cognitoUser);
      }

      await this.userRepository.softDelete({ id });
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private async resolveCognitoUser(sub: string, email: string): Promise<CognitoUserRecord | null> {
    const bySub = await this.cognitoUserDirectory.findUserBySub(sub);
    if (bySub !== null) {
      return bySub;
    }
    return this.cognitoUserDirectory.findUserByEmail(email);
  }

  private async deleteOrTombstone(cognitoUser: CognitoUserRecord): Promise<void> {
    if (this.isSignInWithApple(cognitoUser.identities)) {
      await this.cognitoUserDirectory.tombstoneUser(cognitoUser);
      return;
    }
    await this.cognitoUserDirectory.deleteUser(cognitoUser);
  }

  private isSignInWithApple(identities: string | undefined): boolean {
    return identities !== undefined && identities.includes(SIGN_IN_WITH_APPLE_PROVIDER);
  }
}
