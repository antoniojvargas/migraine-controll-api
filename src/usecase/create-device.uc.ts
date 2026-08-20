import { DeepPartial } from 'typeorm';
import { Device } from '@/domain/device';
import { DeviceRepository } from '@/infra/database/repository/device.repository';
import { DeviceEntity } from '@/infra/database/entities';
import { CreateDeviceDto } from '@/dto/create-device.dto';
import { DeviceOutputDto } from '@/dto/device-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class CreateDeviceUc implements UseCaseInterface<CreateDeviceDto, DeviceOutputDto> {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  execute = async (input: CreateDeviceDto): Promise<DeviceOutputDto> => {
    try {
      const device = Device.createNewDevice(input);
      const persisted = await this.deviceRepository.create(this.mapToEntity(device));
      device.assignId(persisted.id);
      return {
        id: persisted.id,
        profileId: device.profileId,
        status: device.status,
        appVersion: device.appVersion,
        phoneManufacturer: device.phoneManufacturer,
        phoneOsName: device.phoneOsName,
        phoneOsVersion: device.phoneOsVersion,
        updatedAt: persisted.updatedAt,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private mapToEntity(device: Device): DeepPartial<DeviceEntity> {
    return {
      profile: { id: device.profileId },
      status: device.status,
      appVersion: device.appVersion,
      phoneManufacturer: device.phoneManufacturer,
      phoneOsName: device.phoneOsName,
      phoneOsVersion: device.phoneOsVersion,
    };
  }
}
