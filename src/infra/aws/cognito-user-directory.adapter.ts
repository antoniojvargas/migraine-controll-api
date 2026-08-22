import { randomUUID } from 'crypto';
import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AttributeType,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CognitoUserDirectoryPort,
  CognitoUserRecord,
} from '@/usecase/ports/cognito-user-directory.port';

const TOMBSTONE_EMAIL_DOMAIN = 'tombstoned.migraine-control.internal';

export class CognitoUserDirectoryAdapter implements CognitoUserDirectoryPort {
  constructor(
    private readonly client: CognitoIdentityProviderClient,
    private readonly poolId: string,
    private readonly legacyPoolId?: string,
  ) {}

  async findUserBySub(sub: string): Promise<CognitoUserRecord | null> {
    return this.findInPools((poolId) => this.getUserBySubInPool(poolId, sub));
  }

  async findUserByEmail(email: string): Promise<CognitoUserRecord | null> {
    return this.findInPools((poolId) => this.getUserByEmailInPool(poolId, email));
  }

  async tombstoneUser(user: CognitoUserRecord): Promise<void> {
    const tombstoneEmail = `deleted-${randomUUID()}@${TOMBSTONE_EMAIL_DOMAIN}`;
    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: user.poolId,
        Username: user.username,
        UserAttributes: [
          { Name: 'email', Value: tombstoneEmail },
          { Name: 'email_verified', Value: 'false' },
        ],
      }),
    );
  }

  async deleteUser(user: CognitoUserRecord): Promise<void> {
    await this.client.send(
      new AdminDeleteUserCommand({ UserPoolId: user.poolId, Username: user.username }),
    );
  }

  private async findInPools(
    lookup: (poolId: string) => Promise<CognitoUserRecord | null>,
  ): Promise<CognitoUserRecord | null> {
    const foundInCurrentPool = await lookup(this.poolId);
    if (foundInCurrentPool !== null) {
      return foundInCurrentPool;
    }
    if (this.legacyPoolId === undefined || this.legacyPoolId === '') {
      return null;
    }
    return lookup(this.legacyPoolId);
  }

  private async getUserBySubInPool(poolId: string, sub: string): Promise<CognitoUserRecord | null> {
    try {
      const response = await this.client.send(
        new AdminGetUserCommand({ UserPoolId: poolId, Username: sub }),
      );
      return this.toRecord(poolId, response.Username, response.UserAttributes);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        return null;
      }
      throw error;
    }
  }

  private async getUserByEmailInPool(
    poolId: string,
    email: string,
  ): Promise<CognitoUserRecord | null> {
    const response = await this.client.send(
      new ListUsersCommand({
        UserPoolId: poolId,
        Filter: `email = "${email.replace(/"/g, '')}"`,
        Limit: 1,
      }),
    );
    const match = response.Users?.[0];
    if (match === undefined) {
      return null;
    }
    return this.toRecord(poolId, match.Username, match.Attributes);
  }

  private toRecord(
    poolId: string,
    username: string | undefined,
    attributes: AttributeType[] | undefined,
  ): CognitoUserRecord | null {
    if (username === undefined) {
      return null;
    }
    const attributeMap = new Map(
      (attributes ?? []).map((attribute) => [attribute.Name, attribute.Value]),
    );
    return {
      username,
      poolId,
      email: attributeMap.get('email') ?? '',
      identities: attributeMap.get('identities'),
    };
  }
}
