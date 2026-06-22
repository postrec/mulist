import { useCallback, useEffect, useRef, useState } from 'react';

import type { Song } from '../../../domain/models';
import { getRepositories } from '../../../storage';
import { deleteSongPackage } from '../../../storage/songPackageFiles';
import { pickAndImportPdfFiles } from '../../import/services/importPdfFiles';
import type { LibraryView } from '../types';

interface LibraryState {
  error: string | null;
  isImporting: boolean;
  isLoading: boolean;
  notice: string | null;
  selectedTag: string | null;
  songs: readonly Song[];
  tags: readonly string[];
  view: LibraryView;
}

export function useLibrary() {
  const [state, setState] = useState<LibraryState>({
    error: null,
    isImporting: false,
    isLoading: true,
    notice: null,
    selectedTag: null,
    songs: [],
    tags: [],
    view: 'all',
  });
  const hasPurgedTrash = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (view: LibraryView, selectedTag: string | null) => {
      const currentRequest = ++requestId.current;
      setState((current) => ({ ...current, error: null, isLoading: true }));

      try {
        const { songs: repository } = await getRepositories();
        if (!hasPurgedTrash.current) {
          const expiredIds = await repository.findExpiredTrashIds();
          for (const id of expiredIds) {
            await deleteSongPackage(id);
            await repository.remove(id);
          }
          hasPurgedTrash.current = true;
        }
        const [songs, tags] = await Promise.all([
          loadSongs(repository, view, selectedTag),
          repository.findTags(),
        ]);

        if (currentRequest === requestId.current) {
          setState((current) => ({
            ...current,
            isLoading: false,
            songs,
            tags,
          }));
        }
      } catch (error: unknown) {
        if (currentRequest === requestId.current) {
          setState((current) => ({
            ...current,
            error:
              error instanceof Error
                ? error.message
                : '라이브러리를 불러오지 못했습니다.',
            isLoading: false,
          }));
        }
      }
    },
    [],
  );

  useEffect(() => {
    void load(state.view, state.selectedTag);
  }, [load, state.selectedTag, state.view]);

  const selectView = useCallback((view: LibraryView) => {
    setState((current) => ({
      ...current,
      selectedTag: view === 'tags' ? current.selectedTag : null,
      view,
    }));
  }, []);

  const selectTag = useCallback((selectedTag: string) => {
    setState((current) => ({ ...current, selectedTag, view: 'tags' }));
  }, []);

  const runMutation = useCallback(
    async (operation: (repository: SongRepository) => Promise<void>) => {
      try {
        setState((current) => ({ ...current, error: null }));
        const { songs } = await getRepositories();
        await operation(songs);
        await load(state.view, state.selectedTag);
      } catch (error: unknown) {
        setState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '변경사항을 저장하지 못했습니다.',
        }));
      }
    },
    [load, state.selectedTag, state.view],
  );

  const toggleFavorite = useCallback(
    async (song: Song) => {
      await runMutation((repository) =>
        repository.setFavorite(song.id, !song.favorite),
      );
    },
    [runMutation],
  );

  const moveToTrash = useCallback(
    async (song: Song) => {
      await runMutation((repository) => repository.moveToTrash(song.id));
    },
    [runMutation],
  );

  const restore = useCallback(
    async (song: Song) => {
      await runMutation((repository) => repository.restore(song.id));
    },
    [runMutation],
  );

  const importPdfs = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
      isImporting: true,
      notice: null,
    }));

    try {
      const report = await pickAndImportPdfFiles();
      if (!report.cancelled) {
        const details = [
          `${report.importedCount}곡 추가`,
          report.duplicateCount > 0
            ? `중복 ${report.duplicateCount}개 제외`
            : null,
          report.failedCount > 0 ? `실패 ${report.failedCount}개` : null,
        ].filter((detail): detail is string => detail !== null);
        setState((current) => ({ ...current, notice: details.join(' · ') }));
        await load(state.view, state.selectedTag);
      }
    } catch (error: unknown) {
      setState((current) => ({
        ...current,
        error:
          error instanceof Error ? error.message : 'PDF를 가져오지 못했습니다.',
      }));
    } finally {
      setState((current) => ({ ...current, isImporting: false }));
    }
  }, [load, state.selectedTag, state.view]);

  return {
    ...state,
    importPdfs,
    moveToTrash,
    refresh: () => load(state.view, state.selectedTag),
    restore,
    selectTag,
    selectView,
    toggleFavorite,
  };
}

type SongRepository = Awaited<ReturnType<typeof getRepositories>>['songs'];

function loadSongs(
  repository: SongRepository,
  view: LibraryView,
  selectedTag: string | null,
): Promise<readonly Song[]> {
  switch (view) {
    case 'recent':
      return repository.findRecent(30);
    case 'favorites':
      return repository.findFavorites();
    case 'tags':
      return selectedTag
        ? repository.findByTag(selectedTag)
        : Promise.resolve([]);
    case 'trash':
      return repository.findTrash();
    case 'all':
      return repository.findAll();
  }
}
