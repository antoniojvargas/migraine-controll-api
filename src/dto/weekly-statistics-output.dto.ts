export interface WeeklyStatisticsOutputDto {
  weekStart: string;
  migraineCount: number;
  averageIntensity: number | null;
  treatmentCount: number;
}
