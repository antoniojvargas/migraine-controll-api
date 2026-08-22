export interface FindAppVersionInputDto {
  platform: string;
  currentVersion: string;
}

export interface AppVersionCheckOutputDto {
  platform: string;
  latestVersion: string;
  forceUpdate: boolean;
  announcement: boolean;
  updateRequired: boolean;
}
