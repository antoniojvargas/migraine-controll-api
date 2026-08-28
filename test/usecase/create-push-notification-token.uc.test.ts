import { CreatePushNotificationTokenUc } from '@/usecase/create-push-notification-token.uc';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';

describe('CreatePushNotificationTokenUc', () => {
  const build = (): {
    uc: CreatePushNotificationTokenUc;
    repository: PushNotificationTokenRepository;
  } => {
    const repository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as PushNotificationTokenRepository;
    return { uc: new CreatePushNotificationTokenUc(repository), repository };
  };

  it('creates a token when none exists for the user/token pair', async () => {
    const { uc, repository } = build();
    (repository.findOneBy as jest.Mock).mockResolvedValue(null);
    (repository.create as jest.Mock).mockResolvedValue({
      id: 't-1',
      channel: 'ios',
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
    });

    const result = await uc.execute({
      userId: 'u-1',
      token: 'device-token',
      channel: 'ios',
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
    });

    expect(result).toEqual({
      id: 't-1',
      userId: 'u-1',
      token: 'device-token',
      channel: 'ios',
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('updates the channel and provided fields when a token already exists', async () => {
    const { uc, repository } = build();
    (repository.findOneBy as jest.Mock).mockResolvedValue({
      id: 't-1',
      channel: 'ios',
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
    });

    const result = await uc.execute({
      userId: 'u-1',
      token: 'device-token',
      channel: 'android',
      appVersion: '2.0.0',
    });

    expect(repository.update).toHaveBeenCalledWith(
      { user: { id: 'u-1' }, token: 'device-token' },
      { channel: 'android', appVersion: '2.0.0' },
    );
    expect(result).toEqual({
      id: 't-1',
      userId: 'u-1',
      token: 'device-token',
      channel: 'android',
      appVersion: '2.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
    });
  });

  it('rejects a missing token', async () => {
    const { uc } = build();

    await expect(uc.execute({ userId: 'u-1', token: '', channel: 'ios' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
