import type { SQLiteDatabase } from 'expo-sqlite';

import type { NoteLayer, OcrData, Score } from '../../domain/models';
import { parseJson } from '../serialization';

interface ScoreRow {
  content_hash: string | null;
  id: string;
  song_id: string;
  pdf_file: string;
  note_layer_json: string | null;
  ocr_data_json: string | null;
  viewer_layout: string;
  viewer_navigation: string;
  viewer_page: number;
}

export class ScoreRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async save(score: Score, markSongPending = true): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO scores (
         id, song_id, pdf_file, note_layer_json, ocr_data_json, content_hash,
         viewer_layout, viewer_navigation, viewer_page
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         song_id = excluded.song_id,
         pdf_file = excluded.pdf_file,
         note_layer_json = excluded.note_layer_json,
         ocr_data_json = excluded.ocr_data_json,
         content_hash = excluded.content_hash,
         viewer_layout = excluded.viewer_layout,
         viewer_navigation = excluded.viewer_navigation,
         viewer_page = excluded.viewer_page`,
      score.id,
      score.songId,
      score.pdfFile,
      score.noteLayer ? JSON.stringify(score.noteLayer) : null,
      score.ocrData ? JSON.stringify(score.ocrData) : null,
      score.contentHash,
      score.viewState.layout,
      score.viewState.navigationMode,
      score.viewState.currentPage,
    );
    await this.updateSearchIndex(score.songId);
    if (markSongPending) {
      await this.database.runAsync(
        "UPDATE songs SET sync_status = 'pending', updated_at = ? WHERE id = ?",
        new Date().toISOString(),
        score.songId,
      );
    }
  }

  public async findById(id: string): Promise<Score | null> {
    const row = await this.database.getFirstAsync<ScoreRow>(
      'SELECT * FROM scores WHERE id = ?',
      id,
    );
    return row ? toScore(row) : null;
  }

  public async findBySongId(songId: string): Promise<readonly Score[]> {
    const rows = await this.database.getAllAsync<ScoreRow>(
      'SELECT * FROM scores WHERE song_id = ? ORDER BY rowid',
      songId,
    );
    return rows.map(toScore);
  }

  public async findAll(): Promise<readonly Score[]> {
    const rows = await this.database.getAllAsync<ScoreRow>(
      'SELECT * FROM scores ORDER BY rowid',
    );
    return rows.map(toScore);
  }

  public async findByContentHash(contentHash: string): Promise<Score | null> {
    const row = await this.database.getFirstAsync<ScoreRow>(
      'SELECT * FROM scores WHERE content_hash = ?',
      contentHash,
    );
    return row ? toScore(row) : null;
  }

  public async remove(id: string): Promise<void> {
    const score = await this.findById(id);
    await this.database.runAsync('DELETE FROM scores WHERE id = ?', id);
    if (score) await this.updateSearchIndex(score.songId);
  }

  private async updateSearchIndex(songId: string): Promise<void> {
    const rows = await this.database.getAllAsync<{
      ocr_data_json: string | null;
    }>('SELECT ocr_data_json FROM scores WHERE song_id = ?', songId);
    const ocrText = rows
      .map((row) => parseJson<OcrData>(row.ocr_data_json)?.text ?? '')
      .filter(Boolean)
      .join('\n');
    await this.database.runAsync(
      'UPDATE song_search_index SET ocr_text = ? WHERE song_id = ?',
      ocrText,
      songId,
    );
  }
}

function toScore(row: ScoreRow): Score {
  return {
    contentHash: row.content_hash,
    id: row.id,
    songId: row.song_id,
    pdfFile: row.pdf_file,
    noteLayer: parseJson<NoteLayer>(row.note_layer_json),
    ocrData: parseJson<OcrData>(row.ocr_data_json),
    viewState: {
      currentPage: Math.max(1, row.viewer_page),
      layout: row.viewer_layout === 'two-page' ? 'two-page' : 'single',
      navigationMode: normalizeNavigationMode(row.viewer_navigation),
    },
  };
}

function normalizeNavigationMode(
  value: string,
): Score['viewState']['navigationMode'] {
  if (
    value === 'snap' ||
    value === 'snap-horizontal' ||
    value === 'snap-horizontal-page'
  )
    return value;
  if (value === 'swipe') return 'snap-horizontal';
  return 'scroll';
}
