import type { SQLiteDatabase } from 'expo-sqlite';

export type AppLogLevel = 'error' | 'info' | 'warning';

export interface AppLogEntry {
  createdAt: string;
  id: number;
  level: AppLogLevel;
  message: string;
}

export class LogRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async add(level: AppLogLevel, message: string): Promise<void> {
    await this.database.runAsync(
      'INSERT INTO sync_logs (level, message, created_at) VALUES (?, ?, ?)',
      level,
      message,
      new Date().toISOString(),
    );
    await this.database.runAsync(
      `DELETE FROM sync_logs WHERE id NOT IN (
         SELECT id FROM sync_logs ORDER BY created_at DESC LIMIT 1000
       )`,
    );
  }

  public async findRecent(limit = 500): Promise<readonly AppLogEntry[]> {
    const rows = await this.database.getAllAsync<{
      created_at: string;
      id: number;
      level: string;
      message: string;
    }>(
      'SELECT id, level, message, created_at FROM sync_logs ORDER BY created_at DESC LIMIT ?',
      limit,
    );
    return rows.map((row) => ({
      createdAt: row.created_at,
      id: row.id,
      level: normalizeLevel(row.level),
      message: row.message,
    }));
  }

  public async clear(): Promise<void> {
    await this.database.runAsync('DELETE FROM sync_logs');
  }
}

function normalizeLevel(level: string): AppLogLevel {
  return level === 'error' || level === 'warning' ? level : 'info';
}
