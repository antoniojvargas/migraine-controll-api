import { DeepPartial } from 'typeorm';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { PushNotificationTokenEntity } from '@/infra/database/entities';
import { CreatePushNotificationTokenInputDto } from '@/dto/create-push-notification-token-input.dto';
import { PushNotificationTokenOutputDto } from '@/dto/push-notification-token-output.dto';
import { optionalString, requireNonEmpty } from '@/domain/validation';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class CreatePushNotificationTokenUc implements UseCaseInterface<
  CreatePushNotificationTokenInputDto,
  PushNotificationTokenOutputDto
> {
  private readonly repository: PushNotificationTokenRepository;

  constructor(repository: PushNotificationTokenRepository) {
    this.repository = repository;
  }

  execute = async (
    input: CreatePushNotificationTokenInputDto,
  ): Promise<PushNotificationTokenOutputDto> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const token = requireNonEmpty(input.token, 'token');
      const channel = requireNonEmpty(input.channel, 'channel');
      const appVersion = optionalString(input.appVersion, 'appVersion');
      const phoneManufacturer = optionalString(input.phoneManufacturer, 'phoneManufacturer');
      const phoneOsName = optionalString(input.phoneOsName, 'phoneOsName');
      const phoneOsVersion = optionalString(input.phoneOsVersion, 'phoneOsVersion');

      const existing = await this.repository.findOneBy({ user: { id: userId }, token });
      if (existing === null) {
        const entity = await this.repository.create({
          user: { id: userId },
          token,
          channel,
          appVersion,
          phoneManufacturer,
          phoneOsName,
          phoneOsVersion,
        });
        return this.toOutput(entity, userId, token);
      }

      const update: DeepPartial<PushNotificationTokenEntity> = { channel };
      if (input.appVersion !== undefined) {
        update.appVersion = appVersion;
      }
      if (input.phoneManufacturer !== undefined) {
        update.phoneManufacturer = phoneManufacturer;
      }
      if (input.phoneOsName !== undefined) {
        update.phoneOsName = phoneOsName;
      }
      if (input.phoneOsVersion !== undefined) {
        update.phoneOsVersion = phoneOsVersion;
      }
      await this.repository.update({ user: { id: userId }, token }, update);

      return this.toOutput(existing, userId, token, {
        channel: update.channel ?? existing.channel,
        appVersion: update.appVersion !== undefined ? update.appVersion : existing.appVersion,
        phoneManufacturer:
          update.phoneManufacturer !== undefined
            ? update.phoneManufacturer
            : existing.phoneManufacturer,
        phoneOsName: update.phoneOsName !== undefined ? update.phoneOsName : existing.phoneOsName,
        phoneOsVersion:
          update.phoneOsVersion !== undefined ? update.phoneOsVersion : existing.phoneOsVersion,
      });
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private toOutput(
    entity: PushNotificationTokenEntity,
    userId: string,
    token: string,
    overrides?: Partial<PushNotificationTokenEntity>,
  ): PushNotificationTokenOutputDto {
    return {
      id: entity.id,
      userId,
      token,
      channel: overrides?.channel ?? entity.channel,
      appVersion: overrides?.appVersion !== undefined ? overrides.appVersion : entity.appVersion,
      phoneManufacturer:
        overrides?.phoneManufacturer !== undefined
          ? overrides.phoneManufacturer
          : entity.phoneManufacturer,
      phoneOsName:
        overrides?.phoneOsName !== undefined ? overrides.phoneOsName : entity.phoneOsName,
      phoneOsVersion:
        overrides?.phoneOsVersion !== undefined ? overrides.phoneOsVersion : entity.phoneOsVersion,
    };
  }
}
