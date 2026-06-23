import { useCallback, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';

import type { Song } from '../../../domain/models';
import { getRepositories } from '../../../storage';
import { reportError } from '../../../shared/logging/reportError';
import { deleteSongPackage } from '../../../storage/songPackageFiles';
import {
  importScoreImages,
  pickAndImportPdfFiles,
  pickScoreImages,
  type SelectedImageAsset,
} from '../../import/services/importPdfFiles';
import { syncSongNow } from '../../cloud/services/syncWorker';
import { createThreeDayShare } from '../../cloud/services/sharingService';
import type { ScoreMetadata } from '../../pdf-viewer/components/ScoreSettingsModal';
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
        reportError('라이브러리 불러오기 실패', error);
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
        reportError('라이브러리 변경 저장 실패', error);
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

  const updateMetadata = useCallback(
    async (song: Song, metadata: ScoreMetadata) => {
      await runMutation((repository) =>
        repository.save({
          ...song,
          ...metadata,
          syncStatus: 'pending',
          updatedAt: new Date().toISOString(),
        }),
      );
    },
    [runMutation],
  );

  const syncSong = useCallback(
    async (song: Song) => {
      setState((current) => ({
        ...current,
        error: null,
        notice: `${song.title} 동기화 중…`,
      }));
      try {
        await syncSongNow(song.id);
        setState((current) => ({
          ...current,
          notice: `${song.title} 동기화를 완료했습니다.`,
        }));
        await load(state.view, state.selectedTag);
      } catch (error: unknown) {
        reportError(`곡 동기화 실패: ${song.id}`, error);
        setState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '곡을 동기화하지 못했습니다.',
          notice: null,
        }));
      }
    },
    [load, state.selectedTag, state.view],
  );

  const shareSong = useCallback(async (song: Song) => {
    setState((current) => ({
      ...current,
      error: null,
      notice: `${song.title} 공유 준비 중…`,
    }));
    try {
      if (song.syncStatus !== 'synced') {
        setState((current) => ({
          ...current,
          notice: `${song.title} 동기화 후 공유 링크를 만드는 중…`,
        }));
        await syncSongNow(song.id);
      }
      const share = await createThreeDayShare(song.id);
      await Share.share({
        message: `${song.title}\n${share.url}`,
        title: song.title,
      });
      setState((current) => ({
        ...current,
        notice: '3일 동안 사용할 수 있는 공유 링크를 만들었습니다.',
      }));
    } catch (error: unknown) {
      reportError(`곡 공유 실패: ${song.id}`, error);
      setState((current) => ({
        ...current,
        error:
          error instanceof Error ? error.message : '곡을 공유하지 못했습니다.',
        notice: null,
      }));
    }
  }, []);

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
      reportError('PDF 가져오기 실패', error);
      setState((current) => ({
        ...current,
        error:
          error instanceof Error ? error.message : 'PDF를 가져오지 못했습니다.',
      }));
    } finally {
      setState((current) => ({ ...current, isImporting: false }));
    }
  }, [load, state.selectedTag, state.view]);

  const pickImages = useCallback(async () => {
    try {
      setState((current) => ({ ...current, error: null }));
      return await pickScoreImages();
    } catch (error: unknown) {
      reportError('악보 이미지 선택 실패', error);
      setState((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : '갤러리 이미지를 선택하지 못했습니다.',
      }));
      return null;
    }
  }, []);

  const importImages = useCallback(
    async (assets: readonly SelectedImageAsset[]) => {
      setState((current) => ({
        ...current,
        error: null,
        isImporting: true,
        notice: '이미지를 PDF로 변환하는 중…',
      }));
      try {
        const report = await importScoreImages(assets);
        setState((current) => ({
          ...current,
          notice: `${assets.length}장으로 PDF 악보 ${report.importedCount}곡을 추가했습니다. OCR 제목 인식을 대기 중입니다.`,
        }));
        await load(state.view, state.selectedTag);
      } catch (error: unknown) {
        reportError('이미지 PDF 가져오기 실패', error);
        setState((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : '이미지를 PDF로 가져오지 못했습니다.',
          notice: null,
        }));
      } finally {
        setState((current) => ({ ...current, isImporting: false }));
      }
    },
    [load, state.selectedTag, state.view],
  );

  return {
    ...state,
    importImages,
    importPdfs,
    moveToTrash,
    pickImages,
    refresh: () => load(state.view, state.selectedTag),
    restore,
    selectTag,
    selectView,
    shareSong,
    syncSong,
    toggleFavorite,
    updateMetadata,
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
