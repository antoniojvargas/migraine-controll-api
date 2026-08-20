export interface CreatePushNotificationTokenInputDto {
  userId: string;
  token: string;
  channel: string;
  appVersion?: string | null;
  phoneManufacturer?: string | null;
  phoneOsName?: string | null;
  phoneOsVersion?: string | null;
}
