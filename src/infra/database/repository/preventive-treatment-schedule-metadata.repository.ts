import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { PreventiveTreatmentScheduleMetadataEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class PreventiveTreatmentScheduleMetadataRepository implements RepositoryInterface<PreventiveTreatmentScheduleMetadataEntity> {
  constructor(private readonly repository: Repository<PreventiveTreatmentScheduleMetadataEntity>) {}

  async create(
    data: DeepPartial<PreventiveTreatmentScheduleMetadataEntity>,
  ): Promise<PreventiveTreatmentScheduleMetadataEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria:
      | FindOptionsWhere<PreventiveTreatmentScheduleMetadataEntity>
      | FindOptionsWhere<PreventiveTreatmentScheduleMetadataEntity>[],
  ): Promise<PreventiveTreatmentScheduleMetadataEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria:
      | FindOptionsWhere<PreventiveTreatmentScheduleMetadataEntity>
      | FindOptionsWhere<PreventiveTreatmentScheduleMetadataEntity>[],
  ): Promise<PreventiveTreatmentScheduleMetadataEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<PreventiveTreatmentScheduleMetadataEntity>,
    data: DeepPartial<PreventiveTreatmentScheduleMetadataEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<PreventiveTreatmentScheduleMetadataEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
