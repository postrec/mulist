export interface Setlist {
  id: string;
  title: string;
  eventName: string;
  eventDate: string;
  ownerId?: string | null;
  deviceId?: string | null;
  revision?: number;
  serverUpdatedAt?: string | null;
  syncStatus?: 'local' | 'pending' | 'synced' | 'failed';
  deletedAt?: string | null;
}
