import { DeepPartial } from 'typeorm';
import { Session } from '@/domain/session';
import { SessionRepository } from '@/infra/database/repository/session.repository';
import { SessionEntity } from '@/infra/database/entities';
import { SessionOutputDto } from '@/dto/session-output.dto';

export abstract class SessionBaseUc {
  constructor(protected readonly sessionRepository: SessionRepository) {}

  protected mapToEntity(session: Session): DeepPartial<SessionEntity> {
    return {
      device: { id: session.deviceId },
      progSelected: session.progSelected,
      duration: session.duration,
      maxIntensity: session.maxIntensity,
      batteryLevel: session.batteryLevel,
      latitude: session.latitude,
      longitude: session.longitude,
      appVersion: session.appVersion,
      phoneManufacturer: session.phoneManufacturer,
      phoneOsName: session.phoneOsName,
      phoneOsVersion: session.phoneOsVersion,
      treatmentId: session.treatmentId,
    };
  }

  protected toOutput(session: Session): SessionOutputDto {
    return {
      id: session.id as string,
      deviceId: session.deviceId,
      progSelected: session.progSelected,
      duration: session.duration,
      maxIntensity: session.maxIntensity,
      batteryLevel: session.batteryLevel,
      latitude: session.latitude,
      longitude: session.longitude,
      appVersion: session.appVersion,
      phoneManufacturer: session.phoneManufacturer,
      phoneOsName: session.phoneOsName,
      phoneOsVersion: session.phoneOsVersion,
      treatmentId: session.treatmentId,
    };
  }
}
