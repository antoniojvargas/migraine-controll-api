import { OpenMeteoWeatherProviderAdapter } from '@/infra/weather/open-meteo-weather-provider.adapter';

describe('OpenMeteoWeatherProviderAdapter', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('maps the Open-Meteo current weather response to a WeatherReading', async () => {
    const json = jest.fn().mockResolvedValue({
      current: {
        time: '2026-08-25T12:00',
        temperature_2m: 21.5,
        relative_humidity_2m: 55,
        surface_pressure: 1012.3,
        weather_code: 3,
      },
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json }) as unknown as typeof fetch;

    const reading = await new OpenMeteoWeatherProviderAdapter().fetchCurrentWeather(57.649, 10.407);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const requestedUrl = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get('latitude')).toBe('57.649');
    expect(requestedUrl.searchParams.get('longitude')).toBe('10.407');

    expect(reading).toEqual({
      observedAt: new Date('2026-08-25T12:00'),
      temperatureCelsius: 21.5,
      humidityPercent: 55,
      pressureHpa: 1012.3,
      weatherCode: 3,
    });
  });

  it('throws when the provider responds with a non-ok status', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    await expect(new OpenMeteoWeatherProviderAdapter().fetchCurrentWeather(0, 0)).rejects.toThrow(
      'Weather provider responded with status 503',
    );
  });
});
