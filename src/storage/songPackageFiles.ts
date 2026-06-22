import * as FileSystem from 'expo-file-system/legacy';

import type { Song } from '../domain/models';

export function getSongPackageDirectory(songId: string): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('앱 문서 저장소를 사용할 수 없습니다.');
  }
  return `${FileSystem.documentDirectory}song-packages/${songId}/`;
}

export async function createSongPackage(
  song: Song,
  sourcePdfUri: string,
): Promise<string> {
  const directory = getSongPackageDirectory(song.id);
  const pdfFile = `${directory}score_01.pdf`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  await FileSystem.copyAsync({ from: sourcePdfUri, to: pdfFile });
  await FileSystem.writeAsStringAsync(
    `${directory}metadata.json`,
    JSON.stringify(song, null, 2),
  );
  return pdfFile;
}

export async function deleteSongPackage(songId: string): Promise<void> {
  await FileSystem.deleteAsync(getSongPackageDirectory(songId), {
    idempotent: true,
  });
}
