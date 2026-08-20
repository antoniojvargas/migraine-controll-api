import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { AcuteTreatmentWorseFeedbackOptionsEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class AcuteTreatmentWorseFeedbackOptionsRepository implements RepositoryInterface<AcuteTreatmentWorseFeedbackOptionsEntity> {
  constructor(private readonly repository: Repository<AcuteTreatmentWorseFeedbackOptionsEntity>) {}

  async create(
    data: DeepPartial<AcuteTreatmentWorseFeedbackOptionsEntity>,
  ): Promise<AcuteTreatmentWorseFeedbackOptionsEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria:
      | FindOptionsWhere<AcuteTreatmentWorseFeedbackOptionsEntity>
      | FindOptionsWhere<AcuteTreatmentWorseFeedbackOptionsEntity>[],
  ): Promise<AcuteTreatmentWorseFeedbackOptionsEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria:
      | FindOptionsWhere<AcuteTreatmentWorseFeedbackOptionsEntity>
      | FindOptionsWhere<AcuteTreatmentWorseFeedbackOptionsEntity>[],
  ): Promise<AcuteTreatmentWorseFeedbackOptionsEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<AcuteTreatmentWorseFeedbackOptionsEntity>,
    data: DeepPartial<AcuteTreatmentWorseFeedbackOptionsEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<AcuteTreatmentWorseFeedbackOptionsEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
