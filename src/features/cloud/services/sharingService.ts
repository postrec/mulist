import { httpsCallable } from 'firebase/functions';

import { firebaseAuth, firebaseFunctions } from '../../../config/firebase';
import { downloadSongPackage } from './songPackageCloud';

interface ShareResult {
  shareId: string;
  expiresAt: number;
  url: string;
}
export async function createThreeDayShare(
  songId: string,
): Promise<ShareResult> {
  const result = await httpsCallable<{ songId: string }, ShareResult>(
    firebaseFunctions,
    'createThreeDayShare',
  )({ songId });
  return result.data;
}

export async function importSharedSong(shareId: string): Promise<string> {
  const result = await httpsCallable<{ shareId: string }, { songId: string }>(
    firebaseFunctions,
    'importSharedSong',
  )({ shareId });
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('공유 악보를 가져오려면 로그인이 필요합니다.');
  await downloadSongPackage(uid, result.data.songId);
  return result.data.songId;
}
