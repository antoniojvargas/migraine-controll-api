import { dataSource } from '@/infra/database/dataSource';
import { WeatherTileEntity } from '@/infra/database/entities';
import { WeatherTileRepository } from '@/infra/database/repository/weather-tile.repository';
import { initTestDb } from './helpers';

describe('WeatherTileRepository', () => {
  let repository: WeatherTileRepository;

  beforeAll(async () => {
    await initTestDb();
    repository = new WeatherTileRepository(dataSource.getRepository(WeatherTileEntity));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query('DELETE FROM weather_tiles');
  });

  it('creates a tile when it does not exist', async () => {
    const tile = await repository.findOrCreate('u4pruy');

    expect(tile.id).toBeDefined();
    expect(tile.geohash6).toBe('u4pruy');
    expect(tile.historyIngestedAt).toBeNull();
    expect(tile.forecastIngestedAt).toBeNull();
  });

  it('returns the existing tile without creating a duplicate', async () => {
    const created = await repository.findOrCreate('u4pruy');
    const found = await repository.findOrCreate('u4pruy');

    expect(found.id).toBe(created.id);
    const all = await repository.findAllBy({ geohash6: 'u4pruy' });
    expect(all).toHaveLength(1);
  });

  it('finds tiles needing history backfill (never ingested or older than 24h)', async () => {
    await repository.create({
      geohash6: 'never',
      historyIngestedAt: null,
      forecastIngestedAt: null,
    });
    await repository.create({
      geohash6: 'stale',
      historyIngestedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    await repository.create({
      geohash6: 'fresh',
      historyIngestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    });

    const tiles = await repository.findTilesNeedingHistoryBackfill();

    expect(tiles.map((tile) => tile.geohash6).sort()).toEqual(['never', 'stale']);
  });

  it('finds tiles needing forecast update (never ingested or older than 6h)', async () => {
    await repository.create({
      geohash6: 'never',
      historyIngestedAt: null,
      forecastIngestedAt: null,
    });
    await repository.create({
      geohash6: 'stale',
      forecastIngestedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    });
    await repository.create({
      geohash6: 'fresh',
      forecastIngestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    });

    const tiles = await repository.findTilesNeedingForecastUpdate();

    expect(tiles.map((tile) => tile.geohash6).sort()).toEqual(['never', 'stale']);
  });
});
