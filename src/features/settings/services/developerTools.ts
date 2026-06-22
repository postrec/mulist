import { randomUUID } from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

import type { Setlist, Song } from '../../../domain/models';
import { getDatabase } from '../../../storage/database';
import { getRepositories } from '../../../storage';
import {
  deleteSongPackage,
  getSongPackageDirectory,
} from '../../../storage/songPackageFiles';

export interface DatabaseStats {
  schemaVersion: number;
  scoreCount: number;
  setlistCount: number;
  songCount: number;
}
export interface StorageStats {
  bytes: number;
  packages: readonly string[];
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const database = await getDatabase();
  const [version, songs, scores, setlists] = await Promise.all([
    database.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
    database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM songs',
    ),
    database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM scores',
    ),
    database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM setlists',
    ),
  ]);
  return {
    schemaVersion: version?.user_version ?? 0,
    scoreCount: scores?.count ?? 0,
    setlistCount: setlists?.count ?? 0,
    songCount: songs?.count ?? 0,
  };
}

export async function resetLibraryDatabase(): Promise<void> {
  const storage = await getStorageStats();
  for (const packageId of storage.packages) await deleteSongPackage(packageId);
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.execAsync('DELETE FROM setlists; DELETE FROM songs;');
  });
}

export async function rerunOcr(): Promise<number> {
  const repositories = await getRepositories();
  const scores = await repositories.scores.findAll();
  for (const score of scores) await repositories.ocr.enqueue(score.id);
  return scores.length;
}

export async function getOcrPreview(): Promise<readonly string[]> {
  const scores = await (await getRepositories()).scores.findAll();
  return scores
    .filter((score) => score.ocrData?.text)
    .map(
      (score) =>
        `${score.id.slice(0, 8)}: ${score.ocrData?.text.slice(0, 120)}`,
    );
}

export async function getStorageStats(): Promise<StorageStats> {
  if (!FileSystem.documentDirectory) return { bytes: 0, packages: [] };
  const root = `${FileSystem.documentDirectory}song-packages/`;
  const info = await FileSystem.getInfoAsync(root);
  if (!info.exists) return { bytes: 0, packages: [] };
  const packages = await FileSystem.readDirectoryAsync(root);
  let bytes = 0;
  for (const packageId of packages)
    bytes += await directorySize(getSongPackageDirectory(packageId));
  return { bytes, packages };
}

export async function createTestSong(): Promise<void> {
  const now = new Date().toISOString();
  const song: Song = {
    artist: 'MuList Test',
    bpm: 120,
    createdAt: now,
    favorite: false,
    id: randomUUID(),
    originalKey: 'C',
    preferredKey: 'C',
    tags: ['test'],
    title: `테스트 곡 ${new Date().toLocaleTimeString('ko-KR')}`,
    updatedAt: now,
  };
  await (await getRepositories()).songs.save(song);
}

export async function createTestSetlist(): Promise<void> {
  const setlist: Setlist = {
    eventDate: new Date().toISOString().slice(0, 10),
    eventName: 'Developer Test',
    id: randomUUID(),
    title: `테스트 셋리스트 ${new Date().toLocaleTimeString('ko-KR')}`,
  };
  await (await getRepositories()).setlists.save(setlist);
}

async function directorySize(uri: string): Promise<number> {
  const entries = await FileSystem.readDirectoryAsync(uri).catch(() => []);
  let total = 0;
  for (const entry of entries) {
    const child = `${uri}${entry}`;
    const info = await FileSystem.getInfoAsync(child);
    if (info.exists)
      total += info.isDirectory ? await directorySize(`${child}/`) : info.size;
  }
  return total;
}
