import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useState } from 'react';

import type { Setlist, SetlistSong, Song } from '../../../domain/models';
import { getRepositories } from '../../../storage';
import { reportError } from '../../../shared/logging/reportError';
import { exportSetlistPdf } from '../services/exportSetlistPdf';

export function useSetlists() {
  const [setlists, setSetlists] = useState<readonly Setlist[]>([]);
  const [librarySongs, setLibrarySongs] = useState<readonly Song[]>([]);
  const [selected, setSelected] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<readonly Song[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const repositories = await getRepositories();
      const [nextSetlists, nextSongs] = await Promise.all([
        repositories.setlists.findAll(),
        repositories.songs.findAll(),
      ]);
      setSetlists(nextSetlists);
      setLibrarySongs(nextSongs);
    } catch (reason: unknown) {
      reportError('셋리스트 불러오기 실패', reason);
      setError(
        reason instanceof Error
          ? reason.message
          : '셋리스트를 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const select = useCallback(async (setlist: Setlist) => {
    setSelected(setlist);
    const repositories = await getRepositories();
    const relations = await repositories.setlists.findSongs(setlist.id);
    const allSongs = await repositories.songs.findAll();
    setSongs(
      relations
        .map((relation) => allSongs.find((song) => song.id === relation.songId))
        .filter((song): song is Song => Boolean(song)),
    );
  }, []);

  const create = useCallback(
    async (title: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const setlist: Setlist = {
        eventDate: today,
        eventName: '',
        id: randomUUID(),
        title,
      };
      const { setlists: repository } = await getRepositories();
      await repository.save(setlist);
      await load();
      await select(setlist);
    },
    [load, select],
  );

  const update = useCallback(
    async (
      changes: Partial<Pick<Setlist, 'eventDate' | 'eventName' | 'title'>>,
    ) => {
      if (!selected) return;
      const updated = {
        ...selected,
        ...changes,
        syncStatus: 'pending' as const,
      };
      const { setlists: repository } = await getRepositories();
      await repository.save(updated);
      setSelected(updated);
      await load();
    },
    [load, selected],
  );

  const remove = useCallback(async () => {
    if (!selected) return;
    const { setlists: repository } = await getRepositories();
    await repository.remove(selected.id);
    setSelected(null);
    setSongs([]);
    await load();
  }, [load, selected]);

  const replaceSongs = useCallback(
    async (nextSongs: readonly Song[]) => {
      if (!selected) return;
      const relations: SetlistSong[] = nextSongs.map((song, order) => ({
        order,
        setlistId: selected.id,
        songId: song.id,
      }));
      const { setlists: repository } = await getRepositories();
      await repository.replaceSongs(selected.id, relations);
      setSongs(nextSongs);
    },
    [selected],
  );

  const addSong = useCallback(
    async (song: Song) => {
      if (!songs.some((item) => item.id === song.id))
        await replaceSongs([...songs, song]);
    },
    [replaceSongs, songs],
  );

  const moveSong = useCallback(
    async (index: number, offset: -1 | 1) => {
      const destination = index + offset;
      if (destination < 0 || destination >= songs.length) return;
      const next = [...songs];
      [next[index], next[destination]] = [next[destination]!, next[index]!];
      await replaceSongs(next);
    },
    [replaceSongs, songs],
  );

  const moveSongTo = useCallback(
    async (index: number, destination: number) => {
      if (
        index < 0 ||
        destination < 0 ||
        index >= songs.length ||
        destination >= songs.length ||
        index === destination
      )
        return;
      const next = [...songs];
      const [moved] = next.splice(index, 1);
      if (!moved) return;
      next.splice(destination, 0, moved);
      await replaceSongs(next);
    },
    [replaceSongs, songs],
  );

  const exportPdf = useCallback(async () => {
    if (selected) await exportSetlistPdf(selected, songs);
  }, [selected, songs]);

  return {
    addSong,
    create,
    error,
    exportPdf,
    librarySongs,
    moveSong,
    moveSongTo,
    remove,
    select,
    selected,
    setlists,
    songs,
    update,
  };
}
