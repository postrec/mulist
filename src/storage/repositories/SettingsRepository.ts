import type { SQLiteDatabase } from 'expo-sqlite';

import {
  type AppSettings,
  defaultAppSettings,
} from '../../features/settings/domain/AppSettings';

export class SettingsRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async get(): Promise<AppSettings> {
    const row = await this.database.getFirstAsync<{ settings_json: string }>(
      'SELECT settings_json FROM app_settings WHERE id = 1',
    );
    if (!row) return defaultAppSettings;
    try {
      const saved = JSON.parse(row.settings_json) as Partial<AppSettings>;
      return { ...defaultAppSettings, ...saved };
    } catch {
      return defaultAppSettings;
    }
  }

  public async save(settings: AppSettings): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO app_settings (id, settings_json) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET settings_json = excluded.settings_json`,
      JSON.stringify(settings),
    );
  }
}
