import { DeepPartial, FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { WeatherTileEntity } from '@/infra/database/entities';
import { RepositoryInterface } from './repository.interface';

const HISTORY_BACKFILL_THRESHOLD_HOURS = 24;
const FORECAST_UPDATE_THRESHOLD_HOURS = 6;

export class WeatherTileRepository implements RepositoryInterface<WeatherTileEntity> {
  constructor(private readonly repository: Repository<WeatherTileEntity>) {}

  async create(data: DeepPartial<WeatherTileEntity>): Promise<WeatherTileEntity> {
    return this.repository.save(this.repository.create(data));
  }

  findOneBy(
    criteria: FindOptionsWhere<WeatherTileEntity> | FindOptionsWhere<WeatherTileEntity>[],
  ): Promise<WeatherTileEntity | null> {
    return this.repository.findOneBy(criteria);
  }

  findAllBy(
    criteria: FindOptionsWhere<WeatherTileEntity> | FindOptionsWhere<WeatherTileEntity>[],
  ): Promise<WeatherTileEntity[]> {
    return this.repository.findBy(criteria);
  }

  async update(
    criteria: FindOptionsWhere<WeatherTileEntity>,
    data: DeepPartial<WeatherTileEntity>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<WeatherTileEntity> {
    return this.repository.createQueryBuilder(alias);
  }

  async findOrCreate(geohash6: string): Promise<WeatherTileEntity> {
    const existing = await this.repository.findOneBy({ geohash6 });
    if (existing !== null) {
      return existing;
    }
    return this.create({ geohash6, historyIngestedAt: null, forecastIngestedAt: null });
  }

  findTilesNeedingHistoryBackfill(): Promise<WeatherTileEntity[]> {
    const threshold = new Date(Date.now() - HISTORY_BACKFILL_THRESHOLD_HOURS * 60 * 60 * 1000);
    return this.repository
      .createQueryBuilder('weatherTile')
      .where('weatherTile.historyIngestedAt IS NULL')
      .orWhere('weatherTile.historyIngestedAt < :threshold', { threshold })
      .getMany();
  }

  findTilesNeedingForecastUpdate(): Promise<WeatherTileEntity[]> {
    const threshold = new Date(Date.now() - FORECAST_UPDATE_THRESHOLD_HOURS * 60 * 60 * 1000);
    return this.repository
      .createQueryBuilder('weatherTile')
      .where('weatherTile.forecastIngestedAt IS NULL')
      .orWhere('weatherTile.forecastIngestedAt < :threshold', { threshold })
      .getMany();
  }
}
