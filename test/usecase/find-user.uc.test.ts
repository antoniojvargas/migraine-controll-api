import { FindUserUc } from '@/usecase/find-user.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';

const entity = { id: 'u-1', email: 'a@b.com', externalId: 'ext-1', originalEmail: null };

describe('FindUserUc', () => {
  const build = (): { uc: FindUserUc; userRepository: UserRepository } => {
    const userRepository = { findOneBy: jest.fn() } as unknown as UserRepository;
    return { uc: new FindUserUc(userRepository), userRepository };
  };

  it('finds a user by id', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    const result = await uc.execute({ id: 'u-1' });

    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'u-1' });
    expect(result).toEqual(entity);
  });

  it('finds a user by externalId', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    const result = await uc.execute({ externalId: 'ext-1' });

    expect(userRepository.findOneBy).toHaveBeenCalledWith({ externalId: 'ext-1' });
    expect(result).toEqual(entity);
  });

  it('returns null when no user matches', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    const result = await uc.execute({ id: 'u-1' });

    expect(result).toBeNull();
  });

  it('rejects when both id and externalId are provided', async () => {
    const { uc } = build();

    await expect(uc.execute({ id: 'u-1', externalId: 'ext-1' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });

  it('rejects when neither id nor externalId are provided', async () => {
    const { uc } = build();

    await expect(uc.execute({})).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
