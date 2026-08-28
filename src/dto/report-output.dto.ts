export interface TopAnswerOutputDto {
  selectionId: string | null;
  answerText: string | null;
  count: number;
}

export interface TopTreatmentOutputDto {
  treatmentId: string;
  name: string;
  count: number;
}

export interface DayOfWeekCountOutputDto {
  dayOfWeek: number;
  count: number;
}

export interface IntensityBucketOutputDto {
  bucketStart: number;
  bucketEnd: number;
  count: number;
}

export interface MonthlyCountOutputDto {
  month: string;
  count: number;
}

export interface MonthlyAverageOutputDto {
  averagePerMonth: number;
  months: MonthlyCountOutputDto[];
}

export interface ReportOutputDto {
  userId: string;
  from: string | null;
  to: string | null;
  totalMigraines: number;
  intensity: {
    average: number | null;
    min: number | null;
    max: number | null;
  };
  duration: {
    averageMinutes: number | null;
  };
  topTriggers: TopAnswerOutputDto[];
  topSymptoms: TopAnswerOutputDto[];
  topTreatments: TopTreatmentOutputDto[];
  dayOfWeekDistribution: DayOfWeekCountOutputDto[];
  intensityDistribution: IntensityBucketOutputDto[];
  monthlyAverage: MonthlyAverageOutputDto;
}
