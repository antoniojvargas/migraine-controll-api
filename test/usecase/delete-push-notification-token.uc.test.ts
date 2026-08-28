import { DeletePushNotificationTokenUc } from '@/usecase/delete-push-notification-token.uc';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';

describe('DeletePushNotificationTokenUc', () => {
  const build = (): {
    uc: DeletePushNotificationTokenUc;
    repository: PushNotificationTokenRepository;
  } => {
    const repository = {
      findOneBy: jest.fn(),
      delete: jest.fn(),
    } as unknown as PushNotificationTokenRepository;
    return { uc: new DeletePushNotificationTokenUc(repository), repository };
  };

  it('deletes an existing token', async () => {
    const { uc, repository } = build();
    (repository.findOneBy as jest.Mock).mockResolvedValue({ id: 't-1' });

    await uc.execute({ userId: 'u-1', token: 'device-token' });

    expect(repository.delete).toHaveBeenCalledWith({
      user: { id: 'u-1' },
      token: 'device-token',
    });
  });

  it('rejects with 404 when the token does not exist', async () => {
    const { uc, repository } = build();
    (repository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(uc.execute({ userId: 'u-1', token: 'device-token' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'PUSH_NOTIFICATION_TOKEN_NOT_FOUND',
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('rejects a missing userId with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ userId: '', token: 'device-token' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
