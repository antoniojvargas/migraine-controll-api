import {
  AdminUpdateUserAttributesCommand,
  AttributeType,
  CognitoIdentityProviderClient,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CognitoIdentityProviderPort,
  UpdateCognitoUserAttributesInput,
} from '@/usecase/ports/cognito-identity-provider.port';

export class CognitoIdentityProviderAdapter implements CognitoIdentityProviderPort {
  constructor(
    private readonly client: CognitoIdentityProviderClient,
    private readonly poolId: string,
    private readonly legacyPoolId?: string,
  ) {}

  async updateUserAttributes(input: UpdateCognitoUserAttributesInput): Promise<void> {
    try {
      await this.updateInPool(this.poolId, input);
    } catch (error) {
      const hasLegacyPool = this.legacyPoolId !== undefined && this.legacyPoolId !== '';
      if (error instanceof UserNotFoundException && hasLegacyPool) {
        await this.updateInPool(this.legacyPoolId, input);
        return;
      }
      throw error;
    }
  }

  private async updateInPool(
    poolId: string,
    input: UpdateCognitoUserAttributesInput,
  ): Promise<void> {
    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: poolId,
        Username: input.externalId,
        UserAttributes: this.toAttributeList(input.attributes),
      }),
    );
  }

  private toAttributeList(attributes: Record<string, string>): AttributeType[] {
    return Object.entries(attributes).map(([Name, Value]) => ({ Name, Value }));
  }
}
