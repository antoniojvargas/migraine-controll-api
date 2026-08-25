import { IngestWeatherTileUc } from '@/usecase/weather/ingest-weather-tile.uc';
import { WeatherTileRepository } from '@/infra/database/repository/weather-tile.repository';
import { WeatherProvider, WeatherReading } from '@/infra/weather/weather-provider.interface';

describe('IngestWeatherTileUc', () => {
  const buildReading = (overrides: Partial<WeatherReading> = {}): WeatherReading => ({
    observedAt: new Date('2026-08-25T12:00:00.000Z'),
    temperatureCelsius: 21.5,
    humidityPercent: 55,
    pressureHpa: 1012.3,
    weatherCode: 3,
    ...overrides,
  });

  const buildRepository = (): jest.Mocked<WeatherTileRepository> =>
    ({
      findOrCreate: jest.fn(),
      update: jest.fn(),
    }) as unknown as jest.Mocked<WeatherTileRepository>;

  const buildProvider = (reading: WeatherReading): jest.Mocked<WeatherProvider> => ({
    fetchCurrentWeather: jest.fn().mockResolvedValue(reading),
  });

  it('decodes the geohash6, finds or creates the tile and stores the history reading', async () => {
    const reading = buildReading();
    const repository = buildRepository();
    const provider = buildProvider(reading);

    await new IngestWeatherTileUc(repository, provider).execute({
      geohash6: 'u4pruy',
      type: 'history',
    });

    expect(provider.fetchCurrentWeather).toHaveBeenCalledTimes(1);
    const [latitude, longitude] = provider.fetchCurrentWeather.mock.calls[0];
    expect(latitude).toBeCloseTo(57.649, 1);
    expect(longitude).toBeCloseTo(10.407, 1);

    expect(repository.findOrCreate).toHaveBeenCalledWith('u4pruy');
    expect(repository.update).toHaveBeenCalledWith(
      { geohash6: 'u4pruy' },
      expect.objectContaining({
        observedAt: reading.observedAt,
        temperatureCelsius: reading.temperatureCelsius,
        humidityPercent: reading.humidityPercent,
        pressureHpa: reading.pressureHpa,
        weatherCode: reading.weatherCode,
        historyIngestedAt: expect.any(Date),
      }),
    );
    expect(repository.update.mock.calls[0][1]).not.toHaveProperty('forecastIngestedAt');
  });

  it('stores the forecast ingestion timestamp when type is forecast', async () => {
    const repository = buildRepository();
    const provider = buildProvider(buildReading());

    await new IngestWeatherTileUc(repository, provider).execute({
      geohash6: 'u4pruy',
      type: 'forecast',
    });

    expect(repository.update).toHaveBeenCalledWith(
      { geohash6: 'u4pruy' },
      expect.objectContaining({ forecastIngestedAt: expect.any(Date) }),
    );
    expect(repository.update.mock.calls[0][1]).not.toHaveProperty('historyIngestedAt');
  });
});
