import { requireNonEmpty } from '@/domain/validation';
import { DeviceRepository } from '@/infra/database/repository/device.repository';
import { DeviceEntity } from '@/infra/database/entities';
import { FindDevicesInputDto } from '@/dto/find-devices-input.dto';
import { DeviceOutputDto } from '@/dto/device-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindDevicesUc implements UseCaseInterface<FindDevicesInputDto, DeviceOutputDto[]> {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  execute = async (input: FindDevicesInputDto): Promise<DeviceOutputDto[]> => {
    try {
      const profileId = requireNonEmpty(input.profileId, 'profileId');
      const entities = await this.deviceRepository
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.profile', 'profile')
        .where('device.profile_id = :profileId', { profileId })
        .andWhere('device.status = :status', { status: 'active' })
        .orderBy('device.updated_at', 'DESC')
        .getMany();
      return entities.map((entity) => this.toOutput(entity));
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private toOutput(entity: DeviceEntity): DeviceOutputDto {
    return {
      id: entity.id,
      profileId: entity.profile.id,
      status: entity.status,
      appVersion: entity.appVersion,
      phoneManufacturer: entity.phoneManufacturer,
      phoneOsName: entity.phoneOsName,
      phoneOsVersion: entity.phoneOsVersion,
      updatedAt: entity.updatedAt,
    };
  }
}
