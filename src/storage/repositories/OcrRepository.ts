import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { OcrJob, OcrJobStatus } from '../../features/ocr/domain/OcrJob';

interface OcrJobRow {
  attempts: number;
  created_at: string;
  error_message: string | null;
  id: string;
  score_id: string;
  status: OcrJobStatus;
  updated_at: string;
}

export class OcrRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async enqueue(scoreId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.database.runAsync(
      `INSERT INTO ocr_jobs (
         id, score_id, status, attempts, error_message, created_at, updated_at
       ) VALUES (?, ?, 'pending', 0, NULL, ?, ?)
       ON CONFLICT(score_id) DO UPDATE SET
         status = 'pending', error_message = NULL, updated_at = excluded.updated_at`,
      randomUUID(),
      scoreId,
      now,
      now,
    );
  }

  public async claimNext(): Promise<OcrJob | null> {
    const row = await this.database.getFirstAsync<OcrJobRow>(
      `SELECT * FROM ocr_jobs
       WHERE status IN ('pending', 'failed') AND attempts < 3
       ORDER BY created_at LIMIT 1`,
    );
    if (!row) return null;
    await this.update(row.id, 'processing', null, row.attempts + 1);
    return { ...toJob(row), attempts: row.attempts + 1, status: 'processing' };
  }

  public async complete(id: string): Promise<void> {
    await this.update(id, 'completed', null);
  }

  public async fail(id: string, message: string): Promise<void> {
    await this.update(id, 'failed', message);
  }

  private async update(
    id: string,
    status: OcrJobStatus,
    errorMessage: string | null,
    attempts?: number,
  ): Promise<void> {
    await this.database.runAsync(
      `UPDATE ocr_jobs SET status = ?, error_message = ?,
       attempts = COALESCE(?, attempts), updated_at = ? WHERE id = ?`,
      status,
      errorMessage,
      attempts ?? null,
      new Date().toISOString(),
      id,
    );
  }
}

function toJob(row: OcrJobRow): OcrJob {
  return {
    attempts: row.attempts,
    createdAt: row.created_at,
    errorMessage: row.error_message,
    id: row.id,
    scoreId: row.score_id,
    status: row.status,
    updatedAt: row.updated_at,
  };
}
