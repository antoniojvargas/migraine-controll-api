import { DeepPartial } from 'typeorm';
import { PreventiveTreatmentScheduleEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class PreventiveTreatmentScheduleRepository extends BaseRepository<PreventiveTreatmentScheduleEntity> {
  async bulkCreate(
    data: DeepPartial<PreventiveTreatmentScheduleEntity>[],
  ): Promise<PreventiveTreatmentScheduleEntity[]> {
    return this.repository.save(this.repository.create(data));
  }
}
