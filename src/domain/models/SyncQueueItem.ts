export type SyncEntityType = 'song' | 'setlist';
export type SyncOperation = 'upsert' | 'delete' | 'download';

export interface SyncQueueItem {
  attempts: number;
  createdAt: string;
  entityId: string;
  entityType: SyncEntityType;
  id: string;
  lastError: string | null;
  nextAttemptAt: string;
  operation: SyncOperation;
}
