import type { Timestamp } from 'firebase/firestore';

export interface Song {
  id: string; title: string; artist: string; bpm: number | null; tags: string[];
  favorite: boolean; originalKey: string | null; preferredKey: string | null;
  scoreIds: string[]; createdAt: Timestamp; updatedAt: Timestamp;
  deletedAt: Timestamp | null; deviceId: string; revision: number;
}

export interface Setlist {
  id: string; title: string; eventName: string; eventDate: string;
  songIds: string[]; deletedAt: Timestamp | null; deviceId: string;
  revision: number; updatedAt: Timestamp;
}

export type UploadState = 'waiting' | 'uploading' | 'done' | 'error';
export interface UploadItem { id: string; file: File; title: string; state: UploadState; progress: number; error?: string; }
