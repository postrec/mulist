import type {
  ScoreNavigationMode,
  ScorePageLayout,
} from '../../../domain/models';
import {
  detectAppLanguage,
  type AppLanguage,
} from '../../../shared/i18n/language';

export type {
  ScoreNavigationMode,
  ScorePageLayout,
} from '../../../domain/models';

export type { AppLanguage } from '../../../shared/i18n/language';

export type ThemePreference = 'light' | 'dark' | 'system';
export type FontSizePreference = 'small' | 'medium' | 'large';

export interface AppSettings {
  applePencilSmoothing: number;
  autoCropMargin: boolean;
  cloudSyncEnabled: boolean;
  defaultZoom: number;
  defaultPageLayout: ScorePageLayout;
  defaultNavigationMode: ScoreNavigationMode;
  developerMode: boolean;
  fontSize: FontSizePreference;
  landscapeLock: boolean;
  language: AppLanguage;
  pdfPreviewScale: number;
  theme: ThemePreference;
  wifiOnlySync: boolean;
}

export const defaultAppSettings: AppSettings = {
  applePencilSmoothing: 2,
  autoCropMargin: false,
  cloudSyncEnabled: false,
  defaultZoom: 1,
  defaultPageLayout: 'two-page',
  defaultNavigationMode: 'scroll',
  developerMode: false,
  fontSize: 'medium',
  landscapeLock: false,
  language: detectAppLanguage(),
  pdfPreviewScale: 0.35,
  theme: 'system',
  wifiOnlySync: true,
};
