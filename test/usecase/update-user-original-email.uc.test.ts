import { UpdateUserOriginalEmailUc } from '@/usecase/update-user-original-email.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';

const entity = { id: 'u-1', email: 'a@b.com', externalId: 'ext-1', originalEmail: null };

describe('UpdateUserOriginalEmailUc', () => {
  const build = (): { uc: UpdateUserOriginalEmailUc; userRepository: UserRepository } => {
    const userRepository = {
      findOneBy: jest.fn(),
      update: jest.fn(),
    } as unknown as UserRepository;
    return { uc: new UpdateUserOriginalEmailUc(userRepository), userRepository };
  };

  it('updates the originalEmail without touching email', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    const result = await uc.execute({ id: 'u-1', originalEmail: 'first@b.com' });

    expect(userRepository.update).toHaveBeenCalledWith(
      { id: 'u-1' },
      { originalEmail: 'first@b.com' },
    );
    expect(result).toEqual({
      id: 'u-1',
      email: 'a@b.com',
      externalId: 'ext-1',
      originalEmail: 'first@b.com',
    });
  });

  it('throws 404 when the user does not exist', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(uc.execute({ id: 'u-1', originalEmail: 'first@b.com' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('rejects an invalid originalEmail', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    await expect(uc.execute({ id: 'u-1', originalEmail: 'not-an-email' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
