import { Timestamp } from 'firebase/firestore';

import type { Setlist, Song } from '../../../domain/models';

export interface CloudSongDocument {
  artist: string;
  bpm: number | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  deviceId: string;
  favorite: boolean;
  originalKey: string | null;
  preferredKey: string | null;
  revision: number;
  scoreIds: readonly string[];
  tags: readonly string[];
  title: string;
  updatedAt: Timestamp;
}

export function songToCloud(
  song: Song,
  deviceId: string,
  scoreIds: readonly string[],
): CloudSongDocument {
  return {
    artist: song.artist,
    bpm: song.bpm,
    createdAt: Timestamp.fromDate(new Date(song.createdAt)),
    deletedAt: song.deletedAt
      ? Timestamp.fromDate(new Date(song.deletedAt))
      : null,
    deviceId,
    favorite: song.favorite,
    originalKey: song.originalKey,
    preferredKey: song.preferredKey,
    revision: (song.revision ?? 0) + 1,
    scoreIds,
    tags: song.tags,
    title: song.title,
    updatedAt: Timestamp.fromDate(new Date(song.updatedAt)),
  };
}

export function cloudToSong(
  id: string,
  ownerId: string,
  data: CloudSongDocument,
): Song {
  return {
    id,
    title: data.title,
    artist: data.artist,
    bpm: data.bpm,
    originalKey: data.originalKey,
    preferredKey: data.preferredKey,
    tags: data.tags,
    favorite: data.favorite,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    deletedAt: data.deletedAt?.toDate().toISOString() ?? null,
    ownerId,
    deviceId: data.deviceId,
    revision: data.revision,
    serverUpdatedAt: data.updatedAt.toDate().toISOString(),
    syncStatus: 'synced',
  };
}

export interface CloudSetlistDocument {
  deletedAt: Timestamp | null;
  deviceId: string;
  eventDate: string;
  eventName: string;
  revision: number;
  songIds: readonly string[];
  title: string;
  updatedAt: Timestamp;
}

export function setlistToCloud(
  setlist: Setlist,
  deviceId: string,
  songIds: readonly string[],
): CloudSetlistDocument {
  return {
    deletedAt: setlist.deletedAt
      ? Timestamp.fromDate(new Date(setlist.deletedAt))
      : null,
    deviceId,
    eventDate: setlist.eventDate,
    eventName: setlist.eventName,
    revision: (setlist.revision ?? 0) + 1,
    songIds,
    title: setlist.title,
    updatedAt: Timestamp.now(),
  };
}
