import { ChangeUserEmailUc } from '@/usecase/change-user-email.uc';
import { UserRepository } from '@/infra/database/repository/user.repository';

const entity = { id: 'u-1', email: 'old@b.com', externalId: 'ext-1', originalEmail: null };

describe('ChangeUserEmailUc', () => {
  const build = (): { uc: ChangeUserEmailUc; userRepository: UserRepository } => {
    const userRepository = {
      findOneBy: jest.fn(),
      update: jest.fn(),
    } as unknown as UserRepository;
    return { uc: new ChangeUserEmailUc(userRepository), userRepository };
  };

  it('changes the email and keeps the previous one as originalEmail', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    const result = await uc.execute({ id: 'u-1', email: 'new@b.com' });

    expect(userRepository.update).toHaveBeenCalledWith(
      { id: 'u-1' },
      { email: 'new@b.com', originalEmail: 'old@b.com' },
    );
    expect(result).toEqual({
      id: 'u-1',
      email: 'new@b.com',
      externalId: 'ext-1',
      originalEmail: 'old@b.com',
    });
  });

  it('throws 404 when the user does not exist', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(uc.execute({ id: 'u-1', email: 'new@b.com' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('rejects an invalid email', async () => {
    const { uc, userRepository } = build();
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(entity);

    await expect(uc.execute({ id: 'u-1', email: 'not-an-email' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });

  it('rejects when id is empty', async () => {
    const { uc } = build();

    await expect(uc.execute({ id: '', email: 'new@b.com' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
