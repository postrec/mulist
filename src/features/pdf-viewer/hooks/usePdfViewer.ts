import { useCallback, useEffect, useState } from 'react';

import type {
  NoteLayer,
  Score,
  ScoreViewState,
  Song,
} from '../../../domain/models';
import { getRepositories } from '../../../storage';
import type { ScoreMetadata } from '../components/ScoreSettingsModal';

interface ViewerState {
  error: string | null;
  isLoading: boolean;
  noteLayer: NoteLayer;
  score: Score | null;
}

const emptyNoteLayer: NoteLayer = { strokes: [], texts: [], version: 2 };

export function usePdfViewer(song: Song) {
  const [state, setState] = useState<ViewerState>({
    error: null,
    isLoading: true,
    noteLayer: emptyNoteLayer,
    score: null,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, error: null, isLoading: true }));
    void getRepositories()
      .then(async ({ scores, songs }) => {
        await songs.markOpened(song.id);
        return scores.findBySongId(song.id);
      })
      .then(([score]) => {
        if (active) {
          setState({
            error: score ? null : '이 곡에 연결된 PDF가 없습니다.',
            isLoading: false,
            noteLayer: score?.noteLayer ?? emptyNoteLayer,
            score: score ?? null,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState((current) => ({
            ...current,
            error:
              error instanceof Error ? error.message : 'PDF를 열지 못했습니다.',
            isLoading: false,
          }));
        }
      });
    return () => {
      active = false;
    };
  }, [song.id]);

  const saveNoteLayer = useCallback(
    async (noteLayer: NoteLayer) => {
      if (!state.score) return;
      setState((current) => ({ ...current, noteLayer }));
      const { scores } = await getRepositories();
      await scores.save({ ...state.score, noteLayer });
    },
    [state.score],
  );

  const saveBpm = useCallback(
    async (bpm: number): Promise<Song> => {
      const updatedSong: Song = {
        ...song,
        bpm,
        updatedAt: new Date().toISOString(),
      };
      const { songs } = await getRepositories();
      await songs.save(updatedSong);
      return updatedSong;
    },
    [song],
  );

  const saveMetadata = useCallback(
    async (metadata: ScoreMetadata): Promise<Song> => {
      const updatedSong: Song = {
        ...song,
        ...metadata,
        updatedAt: new Date().toISOString(),
      };
      const { songs } = await getRepositories();
      await songs.save(updatedSong);
      return updatedSong;
    },
    [song],
  );

  const saveViewState = useCallback(
    async (viewState: ScoreViewState) => {
      if (!state.score) return;
      const score = { ...state.score, viewState };
      setState((current) => ({ ...current, score }));
      const { scores } = await getRepositories();
      await scores.save(score);
    },
    [state.score],
  );

  return { ...state, saveBpm, saveMetadata, saveNoteLayer, saveViewState };
}
