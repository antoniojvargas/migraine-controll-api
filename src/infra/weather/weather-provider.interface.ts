export interface WeatherReading {
  observedAt: Date;
  temperatureCelsius: number | null;
  humidityPercent: number | null;
  pressureHpa: number | null;
  weatherCode: number | null;
}

export interface WeatherProvider {
  fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherReading>;
}
