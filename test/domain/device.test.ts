import { Device } from '@/domain/device';
import { DomainError } from '@/domain/domain-error';

const validDto = () => ({
  profileId: 'p-1',
  status: 'active',
  appVersion: '1.2.3',
  phoneManufacturer: 'Apple',
});

describe('Device domain', () => {
  it('creates a valid device', () => {
    const device = Device.createNewDevice(validDto());

    expect(device.id).toBeNull();
    expect(device.profileId).toBe('p-1');
    expect(device.status).toBe('active');
    expect(device.appVersion).toBe('1.2.3');
    expect(device.phoneManufacturer).toBe('Apple');
    expect(device.phoneOsName).toBeNull();
    expect(device.phoneOsVersion).toBeNull();
  });

  it('rejects an empty profileId', () => {
    expect(() => Device.createNewDevice({ profileId: '', status: 'active' })).toThrow(DomainError);
  });

  it.each(['', 'bricked', 'ACTIVE'])('rejects invalid status %p', (status) => {
    expect(() => Device.createNewDevice({ profileId: 'p-1', status })).toThrow(DomainError);
  });

  it('rejects an invalid appVersion', () => {
    expect(() =>
      Device.createNewDevice({ profileId: 'p-1', status: 'active', appVersion: 'v1' }),
    ).toThrow(DomainError);
  });

  it('updates device fields', () => {
    const device = Device.createNewDevice(validDto());

    device.updateDevice({ status: 'inactive', phoneOsName: 'iOS', appVersion: null });

    expect(device.status).toBe('inactive');
    expect(device.phoneOsName).toBe('iOS');
    expect(device.appVersion).toBeNull();
  });

  it('rejects an invalid status on update', () => {
    const device = Device.createNewDevice(validDto());

    expect(() => device.updateDevice({ status: 'off' })).toThrow(DomainError);
    expect(device.status).toBe('active');
  });

  it('assigns id only once', () => {
    const device = Device.createNewDevice(validDto());

    device.assignId('d-1');

    expect(device.id).toBe('d-1');
    expect(() => device.assignId('d-2')).toThrow(DomainError);
  });
});
