import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { PreventiveTreatmentScheduleEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class PreventiveTreatmentScheduleRepository implements RepositoryInterface<PreventiveTreatmentScheduleEntity> {
  constructor(private readonly repository: Repository<PreventiveTreatmentScheduleEntity>) {}

  async create(
    data: DeepPartial<PreventiveTreatmentScheduleEntity>,
  ): Promise<PreventiveTreatmentScheduleEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria:
      | FindOptionsWhere<PreventiveTreatmentScheduleEntity>
      | FindOptionsWhere<PreventiveTreatmentScheduleEntity>[],
  ): Promise<PreventiveTreatmentScheduleEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria:
      | FindOptionsWhere<PreventiveTreatmentScheduleEntity>
      | FindOptionsWhere<PreventiveTreatmentScheduleEntity>[],
  ): Promise<PreventiveTreatmentScheduleEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<PreventiveTreatmentScheduleEntity>,
    data: DeepPartial<PreventiveTreatmentScheduleEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<PreventiveTreatmentScheduleEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
