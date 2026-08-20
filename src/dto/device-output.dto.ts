export interface DeviceOutputDto {
  id: string;
  profileId: string;
  status: string;
  appVersion: string | null;
  phoneManufacturer: string | null;
  phoneOsName: string | null;
  phoneOsVersion: string | null;
  updatedAt: Date;
}
