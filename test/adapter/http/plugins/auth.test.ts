import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { registerAuth, CognitoJwtVerifierPort } from '@/adapter/http/plugins/auth';
import { UserRepository } from '@/infra/database/repository/user.repository';

describe('registerAuth', () => {
  const build = (): {
    app: FastifyInstance;
    jwtVerifier: CognitoJwtVerifierPort;
    userRepository: UserRepository;
  } => {
    let authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    const app = {
      decorate: jest.fn((_name: string, fn: typeof authenticate) => {
        authenticate = fn;
      }),
      get authenticate() {
        return authenticate;
      },
    } as unknown as FastifyInstance;
    const jwtVerifier = { verify: jest.fn() } as unknown as CognitoJwtVerifierPort;
    const userRepository = { findOneBy: jest.fn() } as unknown as UserRepository;
    registerAuth(app, jwtVerifier, userRepository);
    return { app, jwtVerifier, userRepository };
  };

  const buildRequest = (headers: Record<string, string | undefined>): FastifyRequest =>
    ({ headers }) as unknown as FastifyRequest;

  it('attaches the resolved user to request.user when the JWT is valid', async () => {
    const { app, jwtVerifier, userRepository } = build();
    (jwtVerifier.verify as jest.Mock).mockResolvedValue({ sub: 'sub-1' });
    const user = { id: 'u-1', externalId: 'sub-1' };
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(user);
    const request = buildRequest({ authorization: 'Bearer valid-token' });

    await app.authenticate(request, {} as FastifyReply);

    expect(jwtVerifier.verify).toHaveBeenCalledWith('valid-token');
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ externalId: 'sub-1' });
    expect(request.user).toEqual(user);
  });

  it('throws 401 when the Authorization header is missing', async () => {
    const { app } = build();
    const request = buildRequest({});

    await expect(app.authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('throws 401 when the Authorization header is malformed', async () => {
    const { app } = build();
    const request = buildRequest({ authorization: 'not-a-bearer-token' });

    await expect(app.authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 when JWT verification fails', async () => {
    const { app, jwtVerifier } = build();
    (jwtVerifier.verify as jest.Mock).mockRejectedValue(new Error('invalid signature'));
    const request = buildRequest({ authorization: 'Bearer bad-token' });

    await expect(app.authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('throws 401 when the sub does not match any local user', async () => {
    const { app, jwtVerifier, userRepository } = build();
    (jwtVerifier.verify as jest.Mock).mockResolvedValue({ sub: 'sub-1' });
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);
    const request = buildRequest({ authorization: 'Bearer valid-token' });

    await expect(app.authenticate(request, {} as FastifyReply)).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });
});
