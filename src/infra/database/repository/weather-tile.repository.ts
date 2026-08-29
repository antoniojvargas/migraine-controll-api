import { WeatherTileEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

const HISTORY_BACKFILL_THRESHOLD_HOURS = 24;
const FORECAST_UPDATE_THRESHOLD_HOURS = 6;

export class WeatherTileRepository extends BaseRepository<WeatherTileEntity> {
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
