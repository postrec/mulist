export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string | null;
  preferredKey: string | null;
  bpm: number | null;
  tags: readonly string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId?: string | null;
  deviceId?: string | null;
  revision?: number;
  serverUpdatedAt?: string | null;
  syncStatus?: 'local' | 'pending' | 'synced' | 'failed';
  deletedAt?: string | null;
}
