export interface CreateSessionDto {
  deviceId: string;
  progSelected: string;
  duration: number;
  maxIntensity: number;
  batteryLevel: number;
  latitude?: number | null;
  longitude?: number | null;
  appVersion?: string;
  phoneManufacturer?: string;
  phoneOsName?: string;
  phoneOsVersion?: string;
  treatmentId?: string | null;
}
