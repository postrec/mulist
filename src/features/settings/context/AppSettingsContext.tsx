import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Appearance } from 'react-native';

import { getRepositories } from '../../../storage';
import { type AppSettings, defaultAppSettings } from '../domain/AppSettings';

interface AppSettingsContextValue {
  isLoading: boolean;
  settings: AppSettings;
  update: (changes: Partial<AppSettings>) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(defaultAppSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getRepositories()
      .then(({ settings: repository }) => repository.get())
      .then((saved) => {
        setSettings(saved);
        applyTheme(saved.theme);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const update = useCallback(
    async (changes: Partial<AppSettings>) => {
      const repositories = await getRepositories();
      const next = { ...settings, ...changes };
      setSettings(next);
      applyTheme(next.theme);
      await repositories.settings.save(next);
    },
    [settings],
  );

  return (
    <AppSettingsContext.Provider value={{ isLoading, settings, update }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  const value = useContext(AppSettingsContext);
  if (!value)
    throw new Error('useAppSettings must be used inside AppSettingsProvider.');
  return value;
}

function applyTheme(theme: AppSettings['theme']): void {
  Appearance.setColorScheme(theme === 'system' ? null : theme);
}
