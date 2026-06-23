import type { SQLiteDatabase } from 'expo-sqlite';

import type { Song } from '../../domain/models';
import { resolveTagId } from '../../domain/tagPresets';
import type { SearchScope } from '../../features/search/types';
import { parseStringArray } from '../serialization';

interface SearchRow {
  artist: string;
  bpm: number | null;
  created_at: string;
  favorite: number;
  id: string;
  original_key: string | null;
  preferred_key: string | null;
  tags_json: string;
  title: string;
  updated_at: string;
}

export class SearchRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async search(
    query: string,
    scope: SearchScope,
  ): Promise<readonly Song[]> {
    const normalized = query.trim();
    if (!normalized) return [];
    const pattern = `%${escapeLike(normalized)}%`;
    const tagPattern = `%${escapeLike(resolveTagId(normalized))}%`;
    const condition = getCondition(scope);
    const rows = await this.database.getAllAsync<SearchRow>(
      `SELECT s.* FROM songs s
       JOIN song_search_index i ON i.song_id = s.id
       WHERE s.deleted_at IS NULL AND (${condition})
       ORDER BY s.updated_at DESC`,
      ...(scope === 'all'
        ? [pattern, pattern, tagPattern, pattern]
        : [scope === 'tag' ? tagPattern : pattern]),
    );
    return rows.map(toSong);
  }
}

function getCondition(scope: SearchScope): string {
  switch (scope) {
    case 'title':
      return `i.title LIKE ? ESCAPE '\\'`;
    case 'artist':
      return `i.artist LIKE ? ESCAPE '\\'`;
    case 'tag':
      return `i.tags LIKE ? ESCAPE '\\'`;
    case 'ocr':
      return `i.ocr_text LIKE ? ESCAPE '\\'`;
    case 'all':
      return `(i.title LIKE ? ESCAPE '\\' OR i.artist LIKE ? ESCAPE '\\'
        OR i.tags LIKE ? ESCAPE '\\' OR i.ocr_text LIKE ? ESCAPE '\\')`;
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function toSong(row: SearchRow): Song {
  return {
    artist: row.artist,
    bpm: row.bpm,
    createdAt: row.created_at,
    favorite: row.favorite === 1,
    id: row.id,
    originalKey: row.original_key,
    preferredKey: row.preferred_key,
    tags: parseStringArray(row.tags_json),
    title: row.title,
    updatedAt: row.updated_at,
  };
}
