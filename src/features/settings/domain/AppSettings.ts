export type ThemePreference = 'light' | 'dark' | 'system';
export type FontSizePreference = 'small' | 'medium' | 'large';

export interface AppSettings {
  autoCropMargin: boolean;
  cloudSyncEnabled: boolean;
  defaultZoom: number;
  developerMode: boolean;
  fontSize: FontSizePreference;
  landscapeLock: boolean;
  theme: ThemePreference;
  wifiOnlySync: boolean;
}

export const defaultAppSettings: AppSettings = {
  autoCropMargin: false,
  cloudSyncEnabled: false,
  defaultZoom: 1,
  developerMode: false,
  fontSize: 'medium',
  landscapeLock: false,
  theme: 'system',
  wifiOnlySync: true,
};
