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

type Authenticator = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserEntity;
  }
  interface FastifyInstance {
    /** Resuelve `request.user` desde el JWT Bearer, o lanza 401. */
    authenticate: Authenticator;
    /**
     * Como `authenticate`, y además exige que `:userId` de la ruta coincida con
     * el id del usuario autenticado (403 si no). Para rutas `/users/:userId/*`.
     */
    authenticateOwner: Authenticator;
  }
}

const AUTHORIZATION_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';
const UNAUTHORIZED_MESSAGE = 'Missing or invalid authorization token';
const FORBIDDEN_MESSAGE = 'You do not have access to this resource';

export const registerAuth = (
  app: FastifyInstance,
  jwtVerifier: CognitoJwtVerifierPort,
  userRepository: UserRepository,
): void => {
  const resolveUser = async (request: FastifyRequest): Promise<UserEntity> => {
    const token = extractBearerToken(request.headers[AUTHORIZATION_HEADER]);
    if (token === null) {
      throw new AppError(401, 'UNAUTHORIZED', UNAUTHORIZED_MESSAGE);
    }
    const payload = await verifyToken(jwtVerifier, token);
    const user = await userRepository.findOneBy({ externalId: payload.sub });
    if (user === null) {
      throw new AppError(401, 'UNAUTHORIZED', UNAUTHORIZED_MESSAGE);
    }
    return user;
  };

  app.decorate('authenticate', async (request: FastifyRequest): Promise<void> => {
    request.user = await resolveUser(request);
  });

  app.decorate('authenticateOwner', async (request: FastifyRequest): Promise<void> => {
    const user = await resolveUser(request);
    request.user = user;
    const routeUserId = (request.params as { userId?: string } | undefined)?.userId;
    if (routeUserId !== undefined && routeUserId !== user.id) {
      throw new AppError(403, 'FORBIDDEN', FORBIDDEN_MESSAGE);
    }
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
