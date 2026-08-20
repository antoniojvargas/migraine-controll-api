import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { DeviceEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

export class DeviceRepository implements RepositoryInterface<DeviceEntity> {
  constructor(private readonly repository: Repository<DeviceEntity>) {}

  async create(data: DeepPartial<DeviceEntity>): Promise<DeviceEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<DeviceEntity> | FindOptionsWhere<DeviceEntity>[],
  ): Promise<DeviceEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<DeviceEntity> | FindOptionsWhere<DeviceEntity>[],
  ): Promise<DeviceEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<DeviceEntity>,
    data: DeepPartial<DeviceEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<DeviceEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
