import { useEffect, useState } from 'react';

import type { Score, Song } from '../../../domain/models';
import { getRepositories } from '../../../storage';
import { reportError } from '../../../shared/logging/reportError';

const MAX_CACHE_SIZE = 3;

export function useSetlistPdfCache(
  activeSongId: string,
  currentScore: Score | null,
  setlistId: string | null,
  setlistSongs: readonly Song[],
): readonly Score[] {
  const [scores, setScores] = useState<readonly Score[]>([]);

  useEffect(() => {
    setScores([]);
  }, [setlistId]);

  useEffect(() => {
    if (!currentScore || currentScore.songId !== activeSongId) return;
    setScores((cached) =>
      setlistId
        ? mergeCache(cached, [currentScore], activeSongId, [activeSongId])
        : [currentScore],
    );
  }, [activeSongId, currentScore, setlistId]);

  useEffect(() => {
    if (!setlistId || setlistSongs.length === 0) return;
    const activeIndex = setlistSongs.findIndex(
      (song) => song.id === activeSongId,
    );
    if (activeIndex < 0) return;
    const desiredSongIds = setlistSongs
      .slice(activeIndex, activeIndex + MAX_CACHE_SIZE)
      .map((song) => song.id);
    let active = true;
    void getRepositories()
      .then(({ scores: repository }) =>
        Promise.all(
          desiredSongIds.map(async (songId) => {
            const [score] = await repository.findBySongId(songId);
            return score ?? null;
          }),
        ),
      )
      .then((loaded) => {
        if (!active) return;
        setScores((cached) =>
          mergeCache(
            cached,
            loaded.filter((score): score is Score => score !== null),
            activeSongId,
            desiredSongIds,
          ),
        );
      })
      .catch((reason: unknown) => {
        reportError('셋리스트 PDF 프리로드 실패', reason);
      });
    return () => {
      active = false;
    };
  }, [activeSongId, setlistId, setlistSongs]);

  return scores;
}

function mergeCache(
  cached: readonly Score[],
  incoming: readonly Score[],
  activeSongId: string,
  desiredSongIds: readonly string[],
): readonly Score[] {
  const next = [...cached];
  for (const score of incoming) {
    const existing = next.findIndex((item) => item.id === score.id);
    if (existing >= 0) next[existing] = score;
    else next.push(score);
  }

  const activeIndex = next.findIndex((score) => score.songId === activeSongId);
  if (activeIndex >= 0) next.push(next.splice(activeIndex, 1)[0]!);

  while (next.length > MAX_CACHE_SIZE) {
    const staleIndex = next.findIndex(
      (score) =>
        score.songId !== activeSongId && !desiredSongIds.includes(score.songId),
    );
    const fallbackIndex = next.findIndex(
      (score) => score.songId !== activeSongId,
    );
    next.splice(staleIndex >= 0 ? staleIndex : Math.max(0, fallbackIndex), 1);
  }
  return next;
}
