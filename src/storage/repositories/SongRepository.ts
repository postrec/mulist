import type { SQLiteDatabase } from 'expo-sqlite';

import type { Song } from '../../domain/models';
import { normalizeTagIds, resolveTagId } from '../../domain/tagPresets';
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
  owner_id: string | null;
  device_id: string | null;
  revision: number;
  server_updated_at: string | null;
  sync_status: Song['syncStatus'];
  deleted_at: string | null;
}

export class SongRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async save(song: Song): Promise<void> {
    const tags = normalizeTagIds(song.tags);
    const syncStatus =
      song.syncStatus === 'synced' && song.serverUpdatedAt === song.updatedAt
        ? 'synced'
        : song.syncStatus === 'failed'
          ? 'failed'
          : song.syncStatus === 'local'
            ? 'local'
            : 'pending';
    await this.database.runAsync(
      `INSERT INTO songs (
        id, title, artist, original_key, preferred_key, bpm, tags_json,
        favorite, created_at, updated_at, deleted_at, owner_id, device_id,
        revision, server_updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        artist = excluded.artist,
        original_key = excluded.original_key,
        preferred_key = excluded.preferred_key,
        bpm = excluded.bpm,
        tags_json = excluded.tags_json,
        favorite = excluded.favorite,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at,
        owner_id = excluded.owner_id, device_id = excluded.device_id,
        revision = excluded.revision, server_updated_at = excluded.server_updated_at,
        sync_status = excluded.sync_status`,
      song.id,
      song.title,
      song.artist,
      song.originalKey,
      song.preferredKey,
      song.bpm,
      JSON.stringify(tags),
      song.favorite ? 1 : 0,
      song.createdAt,
      song.updatedAt,
      song.deletedAt ?? null,
      song.ownerId ?? null,
      song.deviceId ?? null,
      song.revision ?? 0,
      song.serverUpdatedAt ?? null,
      syncStatus,
    );
    await this.database.runAsync(
      `INSERT INTO song_search_index (song_id, title, artist, tags, ocr_text)
       VALUES (?, ?, ?, ?, '')
       ON CONFLICT(song_id) DO UPDATE SET
         title = excluded.title, artist = excluded.artist, tags = excluded.tags`,
      song.id,
      song.title,
      song.artist,
      tags.join(' '),
    );
  }

  public async findById(id: string): Promise<Song | null> {
    const row = await this.database.getFirstAsync<SongRow>(
      'SELECT * FROM songs WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? toSong(row) : null;
  }

  public async findByIdIncludingDeleted(id: string): Promise<Song | null> {
    const row = await this.database.getFirstAsync<SongRow>(
      'SELECT * FROM songs WHERE id = ?',
      id,
    );
    return row ? toSong(row) : null;
  }

  public async findAllIncludingDeleted(): Promise<readonly Song[]> {
    const rows = await this.database.getAllAsync<SongRow>(
      'SELECT * FROM songs ORDER BY updated_at',
    );
    return rows.map(toSong);
  }

  public async findAll(): Promise<readonly Song[]> {
    const rows = await this.database.getAllAsync<SongRow>(
      'SELECT * FROM songs WHERE deleted_at IS NULL ORDER BY created_at DESC',
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
       ORDER BY created_at DESC`,
    );
    return rows.map(toSong);
  }

  public async findByTag(tag: string): Promise<readonly Song[]> {
    const songs = await this.findAll();
    const id = resolveTagId(tag);
    return songs.filter((song) =>
      song.tags.some((item) => resolveTagId(item) === id),
    );
  }

  public async findTags(): Promise<readonly string[]> {
    const songs = await this.findAll();
    const tags = new Set(songs.flatMap((song) => song.tags.map(resolveTagId)));
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
      `UPDATE songs SET favorite = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ? AND deleted_at IS NULL`,
      favorite ? 1 : 0,
      new Date().toISOString(),
      id,
    );
  }

  public async setBpm(id: string, bpm: number | null): Promise<void> {
    await this.database.runAsync(
      `UPDATE songs SET bpm = ?, updated_at = ?, sync_status = 'pending'
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
      `UPDATE songs SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ? AND deleted_at IS NULL`,
      now,
      now,
      id,
    );
  }

  public async restore(id: string): Promise<void> {
    await this.database.runAsync(
      `UPDATE songs SET deleted_at = NULL, updated_at = ?, sync_status = 'pending'
       WHERE id = ? AND deleted_at IS NOT NULL`,
      new Date().toISOString(),
      id,
    );
  }

  public async applyCloudTombstone(
    id: string,
    deletedAt: string,
    revision: number,
  ): Promise<void> {
    await this.database.runAsync(
      `UPDATE songs SET deleted_at = ?, updated_at = ?, revision = ?,
       server_updated_at = ?, sync_status = 'synced' WHERE id = ?`,
      deletedAt,
      deletedAt,
      revision,
      deletedAt,
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
    ownerId: row.owner_id,
    deviceId: row.device_id,
    revision: row.revision,
    serverUpdatedAt: row.server_updated_at,
    syncStatus: row.sync_status ?? 'local',
    deletedAt: row.deleted_at,
  };
}
