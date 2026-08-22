import { CognitoUpdateUserAttributesInputDto } from '@/dto/cognito-update-user-attributes-input.dto';
import { requireNonEmpty } from '@/domain/validation';
import { CognitoIdentityProviderPort } from './ports/cognito-identity-provider.port';
import { UseCaseInterface } from './usecase.interface';

export class CognitoUpdateUserAttributesUc implements UseCaseInterface<
  CognitoUpdateUserAttributesInputDto,
  void
> {
  constructor(private readonly cognitoIdentityProvider: CognitoIdentityProviderPort) {}

  execute = async (input: CognitoUpdateUserAttributesInputDto): Promise<void> => {
    const externalId = requireNonEmpty(input.externalId, 'externalId');
    const attributes = this.buildAttributes(input);

    if (Object.keys(attributes).length === 0) {
      return;
    }

    await this.cognitoIdentityProvider.updateUserAttributes({ externalId, attributes });
  };

  private buildAttributes(input: CognitoUpdateUserAttributesInputDto): Record<string, string> {
    const attributes: Record<string, string> = {};
    if (input.name !== undefined) {
      attributes.name = input.name;
    }
    if (input.gender !== undefined) {
      attributes.gender = input.gender;
    }
    if (input.birthDate !== undefined) {
      attributes.birthdate = input.birthDate;
    }
    return attributes;
  }
}
