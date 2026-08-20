import { UpdateUserUc } from '@/usecase/update-user.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';

const entity = { id: 'u-1', email: 'old@b.com', externalId: 'ext-1', originalEmail: null };

describe('UpdateUserUc', () => {
  const build = (): { uc: UpdateUserUc; userRepository: UserRepository } => {
    const userRepository = { findOneBy: jest.fn(), update: jest.fn() } as unknown as UserRepository;
    return { uc: new UpdateUserUc(userRepository), userRepository };
  };

  it('updates the email', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    const result = await uc.execute({ id: 'u-1', email: 'new@b.com' });

    expect(result).toEqual({
      id: 'u-1',
      email: 'new@b.com',
      externalId: 'ext-1',
      originalEmail: null,
    });
    expect(userRepository.update).toHaveBeenCalledWith(
      { id: 'u-1' },
      { email: 'new@b.com', originalEmail: null },
    );
  });

  it('sets the original email', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    await uc.execute({ id: 'u-1', originalEmail: 'first@b.com' });

    expect(userRepository.update).toHaveBeenCalledWith(
      { id: 'u-1' },
      { email: 'old@b.com', originalEmail: 'first@b.com' },
    );
  });

  it('throws 404 when the user does not exist', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(uc.execute({ id: 'u-1', email: 'new@b.com' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('rejects when there is nothing to update', async () => {
    const { uc } = build();

    await expect(uc.execute({ id: 'u-1' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
