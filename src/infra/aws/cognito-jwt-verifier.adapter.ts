import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoJwtPayload, CognitoJwtVerifierPort } from '@/adapter/http/plugins/auth';

type Verifier = { verify(token: string): Promise<{ sub: string }> };

export class CognitoJwtVerifierAdapter implements CognitoJwtVerifierPort {
  private readonly verifier: Verifier;
  private readonly legacyVerifier?: Verifier;

  constructor(userPoolId: string, legacyUserPoolId?: string) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'access',
      clientId: null,
    });
    this.legacyVerifier =
      legacyUserPoolId === undefined || legacyUserPoolId === ''
        ? undefined
        : CognitoJwtVerifier.create({
            userPoolId: legacyUserPoolId,
            tokenUse: 'access',
            clientId: null,
          });
  }

  async verify(token: string): Promise<CognitoJwtPayload> {
    try {
      const payload = await this.verifier.verify(token);
      return { sub: payload.sub };
    } catch (error) {
      if (this.legacyVerifier === undefined) {
        throw error;
      }
      const payload = await this.legacyVerifier.verify(token);
      return { sub: payload.sub };
    }
  }
}
