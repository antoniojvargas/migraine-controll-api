import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserEntity } from '@/infra/database/entities';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { AppError } from '@/utils/app-error';

export interface CognitoJwtPayload {
  sub: string;
}

export interface CognitoJwtVerifierPort {
  verify(token: string): Promise<CognitoJwtPayload>;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserEntity;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const AUTHORIZATION_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';
const UNAUTHORIZED_MESSAGE = 'Missing or invalid authorization token';

export const registerAuth = (
  app: FastifyInstance,
  jwtVerifier: CognitoJwtVerifierPort,
  userRepository: UserRepository,
): void => {
  app.decorate('authenticate', async (request: FastifyRequest): Promise<void> => {
    const token = extractBearerToken(request.headers[AUTHORIZATION_HEADER]);
    if (token === null) {
      throw new AppError(401, 'UNAUTHORIZED', UNAUTHORIZED_MESSAGE);
    }

    const payload = await verifyToken(jwtVerifier, token);
    const user = await userRepository.findOneBy({ externalId: payload.sub });
    if (user === null) {
      throw new AppError(401, 'UNAUTHORIZED', UNAUTHORIZED_MESSAGE);
    }

    request.user = user;
  });
};

function extractBearerToken(header: string | string[] | undefined): string | null {
  if (typeof header !== 'string' || header.startsWith(BEARER_PREFIX) === false) {
    return null;
  }
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

async function verifyToken(
  jwtVerifier: CognitoJwtVerifierPort,
  token: string,
): Promise<CognitoJwtPayload> {
  try {
    return await jwtVerifier.verify(token);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', UNAUTHORIZED_MESSAGE);
  }
}
