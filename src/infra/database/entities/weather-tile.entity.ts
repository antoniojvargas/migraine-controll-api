import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('weather_tiles')
export class WeatherTileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 6, name: 'geohash6' })
  @Index({ unique: true })
  geohash6!: string;

  @Column({ type: 'timestamptz', name: 'history_ingested_at', nullable: true })
  historyIngestedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'forecast_ingested_at', nullable: true })
  forecastIngestedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'observed_at', nullable: true })
  observedAt!: Date | null;

  @Column({ type: 'float', name: 'temperature_celsius', nullable: true })
  temperatureCelsius!: number | null;

  @Column({ type: 'float', name: 'humidity_percent', nullable: true })
  humidityPercent!: number | null;

  @Column({ type: 'float', name: 'pressure_hpa', nullable: true })
  pressureHpa!: number | null;

  @Column({ type: 'int', name: 'weather_code', nullable: true })
  weatherCode!: number | null;
}
