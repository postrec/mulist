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
}
