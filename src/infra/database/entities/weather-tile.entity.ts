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
}
