import { useAppSettings } from '../../features/settings/context/AppSettingsContext';

export function useAppLanguage(): void {
  const { settings } = useAppSettings();
  void settings.language;
}
