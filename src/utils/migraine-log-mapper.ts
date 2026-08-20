import { MigraineLogEntity } from '@/infra/database/entities';
import { MigraineLogEntryOutputDto } from '@/dto/migraine-log-entry-output.dto';

export function toMigraineLogEntry(log: MigraineLogEntity): MigraineLogEntryOutputDto {
  return {
    id: log.id,
    userId: log.user.id,
    sessionId: log.session?.id ?? null,
    intensity: log.intensity,
    painLocation: log.painLocation,
    startedAt: log.startedAt,
    endedAt: log.endedAt,
  };
}
