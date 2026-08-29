import { CognitoJwtPayload, CognitoJwtVerifierPort } from './auth';

/**
 * Verificador de "JWT" para desarrollo local y e2e: trata el token Bearer como
 * el `sub` del usuario, sin validar firma. NUNCA debe usarse en producción; el
 * único punto de wiring es `src/index.ts` y solo cuando `NODE_ENV !== 'production'`
 * (los handlers Lambda usan `CognitoJwtVerifierAdapter`).
 */
export class InsecureBearerSubVerifier implements CognitoJwtVerifierPort {
  async verify(token: string): Promise<CognitoJwtPayload> {
    return { sub: token };
  }
}
