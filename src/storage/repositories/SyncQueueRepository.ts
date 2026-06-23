import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  SyncEntityType,
  SyncOperation,
  SyncQueueItem,
} from '../../domain/models';

export class SyncQueueRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  public async enqueue(
    type: SyncEntityType,
    entityId: string,
    operation: SyncOperation,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.database.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, next_attempt_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
       attempts = 0, next_attempt_at = excluded.next_attempt_at, last_error = NULL`,
      randomUUID(),
      type,
      entityId,
      operation,
      now,
      now,
    );
  }

  public async findDue(limit = 20): Promise<readonly SyncQueueItem[]> {
    const rows = await this.database.getAllAsync<SyncQueueRow>(
      'SELECT * FROM sync_queue WHERE next_attempt_at <= ? ORDER BY created_at LIMIT ?',
      new Date().toISOString(),
      limit,
    );
    return rows.map(toItem);
  }

  public async complete(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
  }

  public async removeForEntity(
    type: SyncEntityType,
    entityId: string,
  ): Promise<void> {
    await this.database.runAsync(
      'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
      type,
      entityId,
    );
  }

  public async fail(item: SyncQueueItem, lastError: string): Promise<void> {
    const attempts = item.attempts + 1;
    const delay = Math.min(
      3_600_000,
      2 ** attempts * 2_000 + Math.random() * 1_000,
    );
    await this.database.runAsync(
      'UPDATE sync_queue SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?',
      attempts,
      new Date(Date.now() + delay).toISOString(),
      lastError,
      item.id,
    );
  }

  public async count(): Promise<number> {
    const row = await this.database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) count FROM sync_queue',
    );
    return row?.count ?? 0;
  }
}

interface SyncQueueRow {
  attempts: number;
  created_at: string;
  entity_id: string;
  entity_type: SyncEntityType;
  id: string;
  last_error: string | null;
  next_attempt_at: string;
  operation: SyncOperation;
}

function toItem(row: SyncQueueRow): SyncQueueItem {
  return {
    attempts: row.attempts,
    createdAt: row.created_at,
    entityId: row.entity_id,
    entityType: row.entity_type,
    id: row.id,
    lastError: row.last_error,
    nextAttemptAt: row.next_attempt_at,
    operation: row.operation,
  };
}
