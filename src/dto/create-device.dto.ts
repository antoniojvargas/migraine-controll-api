export interface CreateDeviceDto {
  profileId: string;
  status: string;
  appVersion?: string;
  phoneManufacturer?: string;
  phoneOsName?: string;
  phoneOsVersion?: string;
}
