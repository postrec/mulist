import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'mulist.db';
const DATABASE_VERSION = 5;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= openDatabase();
  return databasePromise;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync(
    'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;',
  );

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < DATABASE_VERSION) {
    if (currentVersion < 1) {
      await migrateToVersionOne(database);
    }
    if (currentVersion < 2) {
      await migrateToVersionTwo(database);
    }
    if (currentVersion < 3) {
      await migrateToVersionThree(database);
    }
    if (currentVersion < 4) {
      await migrateToVersionFour(database);
    }
    if (currentVersion < 5) {
      await migrateToVersionFive(database);
    }
  }

  return database;
}

async function migrateToVersionFive(database: SQLite.SQLiteDatabase) {
  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        settings_json TEXT NOT NULL
      );
      PRAGMA user_version = 5;
    `);
  });
}

async function migrateToVersionFour(database: SQLite.SQLiteDatabase) {
  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      ALTER TABLE songs ADD COLUMN last_opened_at TEXT;
      CREATE INDEX songs_last_opened_at_idx ON songs(last_opened_at DESC);
      PRAGMA user_version = 4;
    `);
  });
}

async function migrateToVersionThree(database: SQLite.SQLiteDatabase) {
  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS ocr_jobs (
        id TEXT PRIMARY KEY NOT NULL,
        score_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        attempts INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (score_id) REFERENCES scores(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS ocr_jobs_status_idx
        ON ocr_jobs(status, created_at);

      CREATE TABLE IF NOT EXISTS song_search_index (
        song_id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        artist TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '',
        ocr_text TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      INSERT OR IGNORE INTO song_search_index (song_id, title, artist, tags)
        SELECT id, title, artist, tags_json FROM songs;

      PRAGMA user_version = 3;
    `);
  });
}

async function migrateToVersionTwo(database: SQLite.SQLiteDatabase) {
  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      ALTER TABLE scores ADD COLUMN content_hash TEXT;
      CREATE UNIQUE INDEX scores_content_hash_idx
        ON scores(content_hash) WHERE content_hash IS NOT NULL;
      PRAGMA user_version = 2;
    `);
  });
}

async function migrateToVersionOne(database: SQLite.SQLiteDatabase) {
  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        original_key TEXT,
        preferred_key TEXT,
        bpm INTEGER,
        tags_json TEXT NOT NULL DEFAULT '[]',
        favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE INDEX IF NOT EXISTS songs_updated_at_idx ON songs(updated_at DESC);
      CREATE INDEX IF NOT EXISTS songs_deleted_at_idx ON songs(deleted_at);

      CREATE TABLE IF NOT EXISTS scores (
        id TEXT PRIMARY KEY NOT NULL,
        song_id TEXT NOT NULL,
        pdf_file TEXT NOT NULL,
        note_layer_json TEXT,
        ocr_data_json TEXT,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS scores_song_id_idx ON scores(song_id);

      CREATE TABLE IF NOT EXISTS setlists (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS setlist_songs (
        setlist_id TEXT NOT NULL,
        song_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
        PRIMARY KEY (setlist_id, song_id),
        FOREIGN KEY (setlist_id) REFERENCES setlists(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS setlist_songs_order_idx
        ON setlist_songs(setlist_id, sort_order);

      PRAGMA user_version = 1;
    `);
  });
}
