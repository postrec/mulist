import * as FileSystem from 'expo-file-system/legacy';
import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';

import type { Score, Song } from '../../../domain/models';
import {
  firebaseAuth,
  firestore,
  firebaseStorage,
} from '../../../config/firebase';
import { getRepositories } from '../../../storage';
import { getSongPackageDirectory } from '../../../storage/songPackageFiles';
import {
  cloudToSong,
  type CloudSongDocument,
  songToCloud,
} from '../domain/firestoreMappings';
import { getDeviceId } from './deviceIdentity';

export async function uploadSongPackage(
  uid: string,
  songId: string,
): Promise<void> {
  const repositories = await getRepositories();
  const song = await repositories.songs.findByIdIncludingDeleted(songId);
  if (!song) throw new Error('업로드할 곡을 찾을 수 없습니다.');
  const scores = await repositories.scores.findBySongId(songId);
  const deviceId = await getDeviceId();
  const cloud = songToCloud(
    song,
    deviceId,
    scores.map((score) => score.id),
  );
  const manifest = createPackageManifest(uid, songId, cloud);
  const base = `users/${uid}/songs/${songId}`;
  await uploadJson(`${base}/metadata.json`, manifest);
  if (!song.deletedAt) {
    for (const score of scores) await uploadScore(uid, songId, score, manifest);
  }
  await setDoc(doc(firestore, 'users', uid, 'songs', songId), cloud);
  await writeLocalManifest(songId, manifest);
  await repositories.songs.save({
    ...song,
    ownerId: uid,
    deviceId,
    revision: cloud.revision,
    serverUpdatedAt: cloud.updatedAt.toDate().toISOString(),
    syncStatus: 'synced',
  });
}

async function uploadScore(
  uid: string,
  songId: string,
  score: Score,
  manifest: SongPackageManifest,
): Promise<void> {
  const base = `users/${uid}/songs/${songId}`;
  const pdf = new File(score.pdfFile);
  if (!pdf.exists || pdf.size === null)
    throw new Error('PDF 파일을 읽을 수 없습니다.');
  await uploadFile(`${base}/${score.id}.pdf`, pdf, 'application/pdf');
  await uploadJson(`${base}/${score.id}.sidecar.json`, {
    contentHash: score.contentHash,
    noteLayer: score.noteLayer,
    ocrData: score.ocrData,
    song: manifest,
    viewState: score.viewState,
  });
}

async function writeLocalManifest(
  songId: string,
  manifest: SongPackageManifest,
): Promise<void> {
  const directory = getSongPackageDirectory(songId);
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  await FileSystem.writeAsStringAsync(
    `${directory}metadata.json`,
    JSON.stringify(manifest, null, 2),
  );
}

async function uploadJson(path: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await uploadBody(
    path,
    json,
    new TextEncoder().encode(json).byteLength,
    'application/json',
  );
}

async function uploadFile(
  path: string,
  file: File,
  contentType: string,
): Promise<void> {
  if (file.size === null)
    throw new Error('업로드할 파일 크기를 알 수 없습니다.');
  await uploadBody(path, file, file.size, contentType);
}

async function uploadBody(
  path: string,
  body: File | string,
  size: number,
  contentType: string,
): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('동기화하려면 먼저 로그인해 주세요.');
  const token = await user.getIdToken();
  const bucket = firebaseStorage.app.options.storageBucket;
  if (!bucket)
    throw new Error('Firebase Storage Bucket이 설정되지 않았습니다.');
  const emulator =
    __DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  const host = emulator
    ? `http://${process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? '127.0.0.1'}:9199`
    : 'https://firebasestorage.googleapis.com';
  const startUrl = `${host}/v0/b/${encodeURIComponent(bucket)}/o?name=${encodeURIComponent(path)}`;
  const authorization = `Firebase ${token}`;
  const start = await fetchWithTimeout(startUrl, {
    body: JSON.stringify({ contentType, name: path, size }),
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(size),
      'X-Goog-Upload-Header-Content-Type': contentType,
      'X-Goog-Upload-Protocol': 'resumable',
    },
    method: 'POST',
  });
  const uploadUrl = start.headers.get('X-Goog-Upload-URL');
  if (!start.ok || !uploadUrl) {
    throw new Error(`Storage 업로드 준비에 실패했습니다. (${start.status})`);
  }
  const headers = {
    Authorization: authorization,
    'Content-Type': contentType,
    'X-Goog-Upload-Command': 'upload, finalize',
    'X-Goog-Upload-Offset': '0',
  };
  if (typeof body === 'string') {
    const upload = await fetchWithTimeout(
      uploadUrl,
      { body, headers, method: 'POST' },
      30_000,
    );
    if (!upload.ok)
      throw new Error(`Storage 파일 업로드에 실패했습니다. (${upload.status})`);
    return;
  }

  const task = FileSystem.createUploadTask(uploadUrl, body.uri, {
    headers,
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    void task.cancelAsync().catch(() => undefined);
  }, 90_000);
  try {
    const result = await task.uploadAsync();
    if (timedOut)
      throw new Error('PDF 업로드 시간이 초과되었습니다. 다시 시도해 주세요.');
    if (!result || result.status < 200 || result.status >= 300) {
      throw new Error(
        `Storage 파일 업로드에 실패했습니다. (${result?.status ?? 0})`,
      );
    }
  } catch (reason: unknown) {
    if (timedOut)
      throw new Error('PDF 업로드 시간이 초과되었습니다. 다시 시도해 주세요.');
    throw reason;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithTimeout(
  url: string,
  options: Parameters<typeof fetch>[1],
  timeoutMs = 15_000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (reason: unknown) {
    if (controller.signal.aborted)
      throw new Error('Firebase Storage 연결 시간이 초과되었습니다.');
    throw reason;
  } finally {
    clearTimeout(timeout);
  }
}

export async function restoreCloudLibrary(uid: string): Promise<number> {
  const snapshot = await getDocs(collection(firestore, 'users', uid, 'songs'));
  let restored = 0;
  for (const remote of snapshot.docs) {
    const data = remote.data() as CloudSongDocument;
    const repositories = await getRepositories();
    const local = await repositories.songs.findByIdIncludingDeleted(remote.id);
    if (data.deletedAt) {
      if (local && remoteWins(local, data)) {
        await repositories.songs.applyCloudTombstone(
          remote.id,
          data.deletedAt.toDate().toISOString(),
          data.revision,
        );
      }
      continue;
    }
    if (local && !remoteWins(local, data)) continue;
    await downloadSongPackage(uid, remote.id, data);
    restored += 1;
  }
  return restored;
}

export async function downloadSongPackage(
  uid: string,
  songId: string,
  known?: CloudSongDocument,
): Promise<void> {
  const snapshot = known
    ? null
    : await getDoc(doc(firestore, 'users', uid, 'songs', songId));
  const data = known ?? (snapshot?.data() as CloudSongDocument | undefined);
  if (!data || data.deletedAt) return;
  const repositories = await getRepositories();
  const song = cloudToSong(songId, uid, data);
  await repositories.songs.save(song);
  const directory = getSongPackageDirectory(songId);
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  await writeLocalManifest(songId, createPackageManifest(uid, songId, data));
  for (const scoreId of data.scoreIds) {
    const pdfFile = `${directory}${scoreId}.pdf`;
    const url = await getDownloadURL(
      ref(firebaseStorage, `users/${uid}/songs/${songId}/${scoreId}.pdf`),
    );
    await FileSystem.downloadAsync(url, pdfFile);
    const sidecar = await downloadJson<ScoreSidecar>(
      `users/${uid}/songs/${songId}/${scoreId}.sidecar.json`,
    );
    await repositories.scores.save(
      {
        id: scoreId,
        songId,
        pdfFile,
        contentHash: sidecar.contentHash,
        noteLayer: sidecar.noteLayer,
        ocrData: sidecar.ocrData,
        viewState: sidecar.viewState,
      },
      false,
    );
  }
}

async function downloadJson<T>(path: string): Promise<T> {
  const response = await fetch(
    await getDownloadURL(ref(firebaseStorage, path)),
  );
  if (!response.ok) throw new Error('Sidecar 파일을 다운로드할 수 없습니다.');
  return response.json() as Promise<T>;
}

function remoteWins(local: Song, remote: CloudSongDocument): boolean {
  if (remote.revision !== (local.revision ?? 0))
    return remote.revision > (local.revision ?? 0);
  return remote.updatedAt.toMillis() > new Date(local.updatedAt).getTime();
}

interface ScoreSidecar {
  contentHash: string | null;
  noteLayer: Score['noteLayer'];
  ocrData: Score['ocrData'];
  viewState: Score['viewState'];
  song?: SongPackageManifest;
}

interface SongPackageManifest {
  firestorePath: string;
  schemaVersion: 2;
  song: {
    artist: string;
    bpm: number | null;
    createdAt: string;
    deletedAt: string | null;
    deviceId: string;
    favorite: boolean;
    id: string;
    originalKey: string | null;
    ownerId: string;
    preferredKey: string | null;
    revision: number;
    scoreIds: readonly string[];
    serverUpdatedAt: string;
    syncStatus: 'synced';
    tags: readonly string[];
    title: string;
    updatedAt: string;
  };
  storage: {
    metadataPath: string;
    scores: readonly {
      id: string;
      pdfPath: string;
      sidecarPath: string;
    }[];
  };
}

function createPackageManifest(
  uid: string,
  songId: string,
  data: CloudSongDocument,
): SongPackageManifest {
  const base = `users/${uid}/songs/${songId}`;
  const updatedAt = data.updatedAt.toDate().toISOString();
  return {
    firestorePath: `users/${uid}/songs/${songId}`,
    schemaVersion: 2,
    song: {
      artist: data.artist,
      bpm: data.bpm,
      createdAt: data.createdAt.toDate().toISOString(),
      deletedAt: data.deletedAt?.toDate().toISOString() ?? null,
      deviceId: data.deviceId,
      favorite: data.favorite,
      id: songId,
      originalKey: data.originalKey,
      ownerId: uid,
      preferredKey: data.preferredKey,
      revision: data.revision,
      scoreIds: data.scoreIds,
      serverUpdatedAt: updatedAt,
      syncStatus: 'synced',
      tags: data.tags,
      title: data.title,
      updatedAt,
    },
    storage: {
      metadataPath: `${base}/metadata.json`,
      scores: data.scoreIds.map((id) => ({
        id,
        pdfPath: `${base}/${id}.pdf`,
        sidecarPath: `${base}/${id}.sidecar.json`,
      })),
    },
  };
}
