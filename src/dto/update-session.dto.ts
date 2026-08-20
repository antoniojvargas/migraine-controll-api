export interface UpdateSessionDto {
  progSelected?: string;
  duration?: number;
  maxIntensity?: number;
  batteryLevel?: number;
  latitude?: number | null;
  longitude?: number | null;
  appVersion?: string | null;
  phoneManufacturer?: string | null;
  phoneOsName?: string | null;
  phoneOsVersion?: string | null;
  treatmentId?: string | null;
}
