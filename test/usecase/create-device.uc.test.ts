import { CreateDeviceUc } from '@/usecase/create-device.uc';
import { DeviceRepository } from '@/infra/database/repository/device.repository';

describe('CreateDeviceUc', () => {
  const build = (): { uc: CreateDeviceUc; deviceRepository: DeviceRepository } => {
    const deviceRepository = { create: jest.fn() } as unknown as DeviceRepository;
    return { uc: new CreateDeviceUc(deviceRepository), deviceRepository };
  };

  it('creates a device and returns the output', async () => {
    const { uc, deviceRepository } = build();
    const updatedAt = new Date('2026-08-20T10:00:00.000Z');
    (deviceRepository.create as jest.Mock).mockResolvedValue({ id: 'd-1', updatedAt });

    const result = await uc.execute({
      profileId: 'p-1',
      status: 'active',
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
    });

    expect(result).toEqual({
      id: 'd-1',
      profileId: 'p-1',
      status: 'active',
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
      updatedAt,
    });
    expect(deviceRepository.create).toHaveBeenCalledWith({
      profile: { id: 'p-1' },
      status: 'active',
      appVersion: '1.0.0',
      phoneManufacturer: 'Apple',
      phoneOsName: 'iOS',
      phoneOsVersion: '17.0',
    });
  });

  it('rejects an invalid status with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ profileId: 'p-1', status: 'bogus' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
