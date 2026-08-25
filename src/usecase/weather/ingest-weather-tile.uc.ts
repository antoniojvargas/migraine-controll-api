import { decodeGeohash6 } from '@/utils/geohash';
import { WeatherTileRepository } from '@/infra/database/repository/weather-tile.repository';
import { WeatherProvider } from '@/infra/weather/weather-provider.interface';
import { UseCaseInterface } from '@/usecase/usecase.interface';

export type WeatherIngestionType = 'history' | 'forecast';

export interface IngestWeatherTileInput {
  geohash6: string;
  type: WeatherIngestionType;
}

export class IngestWeatherTileUc implements UseCaseInterface<IngestWeatherTileInput, void> {
  constructor(
    private readonly weatherTileRepository: WeatherTileRepository,
    private readonly weatherProvider: WeatherProvider,
  ) {}

  execute = async ({ geohash6, type }: IngestWeatherTileInput): Promise<void> => {
    const { latitude, longitude } = decodeGeohash6(geohash6);
    const reading = await this.weatherProvider.fetchCurrentWeather(latitude, longitude);

    await this.weatherTileRepository.findOrCreate(geohash6);
    await this.weatherTileRepository.update(
      { geohash6 },
      {
        observedAt: reading.observedAt,
        temperatureCelsius: reading.temperatureCelsius,
        humidityPercent: reading.humidityPercent,
        pressureHpa: reading.pressureHpa,
        weatherCode: reading.weatherCode,
        ...(type === 'history'
          ? { historyIngestedAt: new Date() }
          : { forecastIngestedAt: new Date() }),
      },
    );
  };
}
