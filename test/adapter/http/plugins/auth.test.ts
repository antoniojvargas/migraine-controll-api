import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { registerAuth, CognitoJwtVerifierPort } from '@/adapter/http/plugins/auth';
import { UserRepository } from '@/infra/database/repository/user.repository';

type Authenticator = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

describe('registerAuth', () => {
  const build = (): {
    authenticate: Authenticator;
    authenticateOwner: Authenticator;
    jwtVerifier: CognitoJwtVerifierPort;
    userRepository: UserRepository;
  } => {
    const decorations: Record<string, Authenticator> = {};
    const app = {
      decorate: jest.fn((name: string, fn: Authenticator) => {
        decorations[name] = fn;
      }),
    } as unknown as FastifyInstance;
    const jwtVerifier = { verify: jest.fn() } as unknown as CognitoJwtVerifierPort;
    const userRepository = { findOneBy: jest.fn() } as unknown as UserRepository;
    registerAuth(app, jwtVerifier, userRepository);
    return {
      authenticate: decorations.authenticate,
      authenticateOwner: decorations.authenticateOwner,
      jwtVerifier,
      userRepository,
    };
  };

  const buildRequest = (
    headers: Record<string, string | undefined>,
    params: Record<string, string> = {},
  ): FastifyRequest => ({ headers, params }) as unknown as FastifyRequest;

  describe('authenticate', () => {
    it('attaches the resolved user to request.user when the JWT is valid', async () => {
      const { authenticate, jwtVerifier, userRepository } = build();
      (jwtVerifier.verify as jest.Mock).mockResolvedValue({ sub: 'sub-1' });
      const user = { id: 'u-1', externalId: 'sub-1' };
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(user);
      const request = buildRequest({ authorization: 'Bearer valid-token' });

      await authenticate(request, {} as FastifyReply);

      expect(jwtVerifier.verify).toHaveBeenCalledWith('valid-token');
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ externalId: 'sub-1' });
      expect(request.user).toEqual(user);
    });

    it('throws 401 when the Authorization header is missing', async () => {
      const { authenticate } = build();
      const request = buildRequest({});

      await expect(authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    });

    it('throws 401 when the Authorization header is malformed', async () => {
      const { authenticate } = build();
      const request = buildRequest({ authorization: 'not-a-bearer-token' });

      await expect(authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 when JWT verification fails', async () => {
      const { authenticate, jwtVerifier } = build();
      (jwtVerifier.verify as jest.Mock).mockRejectedValue(new Error('invalid signature'));
      const request = buildRequest({ authorization: 'Bearer bad-token' });

      await expect(authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    });

    it('throws 401 when the sub does not match any local user', async () => {
      const { authenticate, jwtVerifier, userRepository } = build();
      (jwtVerifier.verify as jest.Mock).mockResolvedValue({ sub: 'sub-1' });
      (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      const request = buildRequest({ authorization: 'Bearer valid-token' });

      await expect(authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('authenticateOwner', () => {
    const withUser = (): {
      authenticateOwner: Authenticator;
      userRepository: UserRepository;
    } => {
      const { authenticateOwner, jwtVerifier, userRepository } = build();
      (jwtVerifier.verify as jest.Mock).mockResolvedValue({ sub: 'sub-1' });
      (userRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 'u-1', externalId: 'sub-1' });
      return { authenticateOwner, userRepository };
    };

    it('passes and attaches the user when :userId matches the token identity', async () => {
      const { authenticateOwner } = withUser();
      const request = buildRequest({ authorization: 'Bearer valid-token' }, { userId: 'u-1' });

      await authenticateOwner(request, {} as FastifyReply);

      expect(request.user).toMatchObject({ id: 'u-1' });
    });

    it('throws 403 when :userId belongs to a different user', async () => {
      const { authenticateOwner } = withUser();
      const request = buildRequest(
        { authorization: 'Bearer valid-token' },
        { userId: 'someone-else' },
      );

      await expect(authenticateOwner(request, {} as FastifyReply)).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('throws 401 when there is no token, before any ownership check', async () => {
      const { authenticateOwner } = build();
      const request = buildRequest({}, { userId: 'u-1' });

      await expect(authenticateOwner(request, {} as FastifyReply)).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });
});
