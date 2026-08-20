import { CreateUserUc } from '@/usecase/create-user.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';

describe('CreateUserUc', () => {
  const build = (): { uc: CreateUserUc; userRepository: UserRepository } => {
    const userRepository = { create: jest.fn() } as unknown as UserRepository;
    return { uc: new CreateUserUc(userRepository), userRepository };
  };

  it('creates a user and returns the output', async () => {
    const { uc, userRepository } = build();
    (userRepository.create as jest.Mock).mockResolvedValue({
      id: 'u-1',
      email: 'a@b.com',
      externalId: 'ext-1',
      originalEmail: null,
    });

    const result = await uc.execute({ email: 'A@B.com', externalId: 'ext-1' });

    expect(result).toEqual({
      id: 'u-1',
      email: 'a@b.com',
      externalId: 'ext-1',
      originalEmail: null,
    });
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      externalId: 'ext-1',
      originalEmail: null,
    });
  });

  it('rejects an invalid email with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ email: 'not-an-email', externalId: 'ext-1' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });

  it('rejects an empty externalId with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ email: 'a@b.com', externalId: ' ' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
