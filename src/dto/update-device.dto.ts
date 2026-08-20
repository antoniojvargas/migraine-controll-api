export interface UpdateDeviceDto {
  status?: string;
  appVersion?: string | null;
  phoneManufacturer?: string | null;
  phoneOsName?: string | null;
  phoneOsVersion?: string | null;
}
