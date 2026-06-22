import type { SQLiteDatabase } from 'expo-sqlite';

import type { Song } from '../../domain/models';
import { parseStringArray } from '../serialization';

interface SongRow {
  id: string;
  title: string;
  artist: string;
  original_key: string | null;
  preferred_key: string | null;
  bpm: number | null;
  tags_json: string;
  favorite: number;
  created_at: string;
  updated_at: string;
}

export class SongRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async save(song: Song): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO songs (
        id, title, artist, original_key, preferred_key, bpm, tags_json,
        favorite, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        artist = excluded.artist,
        original_key = excluded.original_key,
        preferred_key = excluded.preferred_key,
        bpm = excluded.bpm,
        tags_json = excluded.tags_json,
        favorite = excluded.favorite,
        updated_at = excluded.updated_at,
        deleted_at = NULL`,
      song.id,
      song.title,
      song.artist,
      song.originalKey,
      song.preferredKey,
      song.bpm,
      JSON.stringify(song.tags),
      song.favorite ? 1 : 0,
      song.createdAt,
      song.updatedAt,
    );
    await this.database.runAsync(
      `INSERT INTO song_search_index (song_id, title, artist, tags, ocr_text)
       VALUES (?, ?, ?, ?, '')
       ON CONFLICT(song_id) DO UPDATE SET
         title = excluded.title, artist = excluded.artist, tags = excluded.tags`,
      song.id,
      song.title,
      song.artist,
      song.tags.join(' '),
    );
  }

  public async findById(id: string): Promise<Song | null> {
    const row = await this.database.getFirstAsync<SongRow>(
      'SELECT * FROM songs WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? toSong(row) : null;
  }

  public async findAll(): Promise<readonly Song[]> {
    const rows = await this.database.getAllAsync<SongRow>(
      'SELECT * FROM songs WHERE deleted_at IS NULL ORDER BY updated_at DESC',
    );
    return rows.map(toSong);
  }

  public async findRecent(limit = 30): Promise<readonly Song[]> {
    const rows = await this.database.getAllAsync<SongRow>(
      `SELECT * FROM songs
       WHERE deleted_at IS NULL AND last_opened_at IS NOT NULL
       ORDER BY last_opened_at DESC
       LIMIT ?`,
      limit,
    );
    return rows.map(toSong);
  }

  public async findFavorites(): Promise<readonly Song[]> {
    const rows = await this.database.getAllAsync<SongRow>(
      `SELECT * FROM songs
       WHERE deleted_at IS NULL AND favorite = 1
       ORDER BY updated_at DESC`,
    );
    return rows.map(toSong);
  }

  public async findByTag(tag: string): Promise<readonly Song[]> {
    const songs = await this.findAll();
    return songs.filter((song) => song.tags.includes(tag));
  }

  public async findTags(): Promise<readonly string[]> {
    const songs = await this.findAll();
    const tags = new Set(songs.flatMap((song) => song.tags));
    return [...tags].sort((left, right) => left.localeCompare(right));
  }

  public async findTrash(): Promise<readonly Song[]> {
    const rows = await this.database.getAllAsync<SongRow>(
      `SELECT * FROM songs
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`,
    );
    return rows.map(toSong);
  }

  public async setFavorite(id: string, favorite: boolean): Promise<void> {
    await this.database.runAsync(
      `UPDATE songs SET favorite = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      favorite ? 1 : 0,
      new Date().toISOString(),
      id,
    );
  }

  public async setBpm(id: string, bpm: number | null): Promise<void> {
    await this.database.runAsync(
      `UPDATE songs SET bpm = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      bpm,
      new Date().toISOString(),
      id,
    );
  }

  public async markOpened(id: string): Promise<void> {
    await this.database.runAsync(
      'UPDATE songs SET last_opened_at = ? WHERE id = ? AND deleted_at IS NULL',
      new Date().toISOString(),
      id,
    );
  }

  public async moveToTrash(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.database.runAsync(
      `UPDATE songs SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      now,
      now,
      id,
    );
  }

  public async restore(id: string): Promise<void> {
    await this.database.runAsync(
      `UPDATE songs SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND deleted_at IS NOT NULL`,
      new Date().toISOString(),
      id,
    );
  }

  public async findExpiredTrashIds(
    retentionDays = 30,
  ): Promise<readonly string[]> {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
    const rows = await this.database.getAllAsync<{ id: string }>(
      `SELECT id FROM songs
       WHERE deleted_at IS NOT NULL AND deleted_at <= ?`,
      cutoff.toISOString(),
    );
    return rows.map((row) => row.id);
  }

  public async remove(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM songs WHERE id = ?', id);
  }
}

function toSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.original_key,
    preferredKey: row.preferred_key,
    bpm: row.bpm,
    tags: parseStringArray(row.tags_json),
    favorite: row.favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
