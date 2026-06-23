import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { doc, setDoc } from 'firebase/firestore';
import type { AppStateStatus } from 'react-native';

import { firebaseAuth, firestore } from '../../../config/firebase';
import { getRepositories } from '../../../storage';
import { reportError } from '../../../shared/logging/reportError';
import { getDeviceId } from './deviceIdentity';
import { setlistToCloud } from '../domain/firestoreMappings';
import { restoreCloudLibrary, uploadSongPackage } from './songPackageCloud';

let running: Promise<void> | null = null;

export function runCloudSync(): Promise<void> {
  running ??= execute().finally(() => {
    running = null;
  });
  return running;
}

export async function syncSongNow(songId: string): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('동기화하려면 먼저 로그인해 주세요.');
  const network = await NetInfo.fetch();
  if (network.isConnected !== true || network.isInternetReachable === false) {
    throw new Error('인터넷 연결을 확인해 주세요.');
  }
  await uploadSongPackage(uid, songId);
  const repositories = await getRepositories();
  await repositories.syncQueue.removeForEntity('song', songId);
}

async function execute(): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;
  const repositories = await getRepositories();
  const settings = await repositories.settings.get();
  if (!settings.cloudSyncEnabled) return;
  const network = await NetInfo.fetch();
  if (!canSync(network, settings.wifiOnlySync)) return;

  for (const song of await repositories.songs.findAllIncludingDeleted()) {
    if (song.syncStatus !== 'synced')
      await repositories.syncQueue.enqueue(
        'song',
        song.id,
        song.deletedAt ? 'delete' : 'upsert',
      );
  }
  for (const setlist of await repositories.setlists.findAllIncludingDeleted()) {
    if (setlist.syncStatus !== 'synced')
      await repositories.syncQueue.enqueue(
        'setlist',
        setlist.id,
        setlist.deletedAt ? 'delete' : 'upsert',
      );
  }

  for (const item of await repositories.syncQueue.findDue()) {
    try {
      if (item.entityType === 'song')
        await uploadSongPackage(uid, item.entityId);
      else await uploadSetlist(uid, item.entityId);
      await repositories.syncQueue.complete(item.id);
    } catch (reason: unknown) {
      reportError(
        `백그라운드 동기화 실패: ${item.entityType}/${item.entityId}`,
        reason,
      );
      await repositories.syncQueue.fail(
        item,
        reason instanceof Error ? reason.message : '알 수 없는 동기화 오류',
      );
    }
  }
  await restoreCloudLibrary(uid);
}

async function uploadSetlist(uid: string, id: string): Promise<void> {
  const repositories = await getRepositories();
  const setlist = await repositories.setlists.findById(id);
  if (!setlist) return;
  const songs = await repositories.setlists.findSongs(id);
  const data = setlistToCloud(
    setlist,
    await getDeviceId(),
    songs.map((item) => item.songId),
  );
  await setDoc(doc(firestore, 'users', uid, 'setlists', id), data);
  await repositories.setlists.save({
    ...setlist,
    ownerId: uid,
    deviceId: data.deviceId,
    revision: data.revision,
    serverUpdatedAt: data.updatedAt.toDate().toISOString(),
    syncStatus: 'synced',
  });
}

function canSync(network: NetInfoState, wifiOnly: boolean): boolean {
  return (
    network.isConnected === true &&
    network.isInternetReachable !== false &&
    (!wifiOnly || network.type === 'wifi')
  );
}

export function startCloudSyncWorker(): () => void {
  const unsubscribeNetwork = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false)
      void runCloudSync();
  });
  const unsubscribeAuth = firebaseAuth.onAuthStateChanged((user) => {
    if (user) void runCloudSync();
  });
  void runCloudSync();
  return () => {
    unsubscribeNetwork();
    unsubscribeAuth();
  };
}

export function syncOnAppState(state: AppStateStatus): void {
  if (state === 'active') void runCloudSync();
}
