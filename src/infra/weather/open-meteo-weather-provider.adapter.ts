import { envs } from '@/config/env';
import { WeatherProvider, WeatherReading } from './weather-provider.interface';

interface OpenMeteoCurrentResponse {
  current: {
    time: string;
    temperature_2m: number | null;
    relative_humidity_2m: number | null;
    surface_pressure: number | null;
    weather_code: number | null;
  };
}

export class OpenMeteoWeatherProviderAdapter implements WeatherProvider {
  async fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherReading> {
    const url = new URL(envs.WEATHER_PROVIDER_BASE_URL);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,surface_pressure,weather_code',
    );

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather provider responded with status ${response.status}`);
    }

    const body = (await response.json()) as OpenMeteoCurrentResponse;

    return {
      observedAt: new Date(body.current.time),
      temperatureCelsius: body.current.temperature_2m,
      humidityPercent: body.current.relative_humidity_2m,
      pressureHpa: body.current.surface_pressure,
      weatherCode: body.current.weather_code,
    };
  }
}
