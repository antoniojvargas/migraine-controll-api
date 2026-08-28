import { FindDevicesUc } from '@/usecase/find-devices.uc';
import { DeviceRepository } from '@/infra/database/repository/device.repository';
import { createQueryBuilderMock } from './helpers';

describe('FindDevicesUc', () => {
  const build = (): { uc: FindDevicesUc; deviceRepository: DeviceRepository } => {
    const deviceRepository = { createQueryBuilder: jest.fn() } as unknown as DeviceRepository;
    return { uc: new FindDevicesUc(deviceRepository), deviceRepository };
  };

  it('returns active devices for a profile', async () => {
    const { uc, deviceRepository } = build();
    const updatedAt = new Date('2026-08-20T10:00:00.000Z');
    (deviceRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getMany: [
          {
            id: 'd-1',
            profile: { id: 'p-1' },
            status: 'active',
            appVersion: '1.0.0',
            phoneManufacturer: 'Apple',
            phoneOsName: 'iOS',
            phoneOsVersion: '17.0',
            updatedAt,
          },
        ],
      }),
    );

    const result = await uc.execute({ profileId: 'p-1' });

    expect(result).toEqual([
      {
        id: 'd-1',
        profileId: 'p-1',
        status: 'active',
        appVersion: '1.0.0',
        phoneManufacturer: 'Apple',
        phoneOsName: 'iOS',
        phoneOsVersion: '17.0',
        updatedAt,
      },
    ]);
  });

  it('rejects a missing profileId with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ profileId: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
