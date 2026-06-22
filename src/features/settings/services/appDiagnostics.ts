import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface AppDiagnostics {
  appVersion: string;
  buildNumber: string;
  deviceModel: string;
  osVersion: string;
}

export function getAppDiagnostics(): AppDiagnostics {
  return {
    appVersion:
      Constants.expoConfig?.version ??
      Application.nativeApplicationVersion ??
      'unknown',
    buildNumber:
      Constants.expoConfig?.ios?.buildNumber ??
      String(
        Constants.expoConfig?.android?.versionCode ??
          Application.nativeBuildVersion ??
          'development',
      ),
    deviceModel: Device.modelName ?? 'Unknown Device',
    osVersion: `${Platform.OS} ${String(Platform.Version)}`,
  };
}
