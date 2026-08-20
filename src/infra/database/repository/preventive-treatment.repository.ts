import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { PreventiveTreatmentEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class PreventiveTreatmentRepository implements RepositoryInterface<PreventiveTreatmentEntity> {
  constructor(private readonly repository: Repository<PreventiveTreatmentEntity>) {}

  async create(data: DeepPartial<PreventiveTreatmentEntity>): Promise<PreventiveTreatmentEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria:
      FindOptionsWhere<PreventiveTreatmentEntity> | FindOptionsWhere<PreventiveTreatmentEntity>[],
  ): Promise<PreventiveTreatmentEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria:
      FindOptionsWhere<PreventiveTreatmentEntity> | FindOptionsWhere<PreventiveTreatmentEntity>[],
  ): Promise<PreventiveTreatmentEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<PreventiveTreatmentEntity>,
    data: DeepPartial<PreventiveTreatmentEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<PreventiveTreatmentEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
