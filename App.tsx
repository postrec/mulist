import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Linking, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Setlist, Song } from './src/domain/models';
import { useLibrary } from './src/features/library/hooks/useLibrary';
import { LibraryScreen } from './src/features/library/screens/LibraryScreen';
import { PdfViewerScreen } from './src/features/pdf-viewer/screens/PdfViewerScreen';
import { SearchScreen } from './src/features/search/screens/SearchScreen';
import { SocialScreen } from './src/features/social/screens/SocialScreen';
import { SetlistsScreen } from './src/features/setlists/screens/SetlistsScreen';
import { SettingsScreen } from './src/features/settings/screens/SettingsScreen';
import { AppSettingsProvider } from './src/features/settings/context/AppSettingsContext';
import {
  startCloudSyncWorker,
  syncOnAppState,
} from './src/features/cloud/services/syncWorker';
import { importSharedSong } from './src/features/cloud/services/sharingService';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AppContent />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();
  const statusStyle = colorScheme === 'dark' ? 'light' : 'dark';
  const library = useLibrary();
  const refreshLibrary = library.refresh;
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [areSetlistsOpen, setAreSetlistsOpen] = useState(false);
  const [areSettingsOpen, setAreSettingsOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [viewerSetlist, setViewerSetlist] = useState<{
    currentSongId: string;
    setlist: Setlist;
    songs: readonly Song[];
  } | null>(null);

  const openLibrarySong = (song: Song) => {
    setViewerSetlist(null);
    setSelectedSong(song);
  };

  useEffect(() => {
    const stopWorker = startCloudSyncWorker(() => void refreshLibrary());
    const subscription = AppState.addEventListener('change', syncOnAppState);
    return () => {
      stopWorker();
      subscription.remove();
    };
  }, [refreshLibrary]);

  useEffect(() => {
    const openShare = (url: string | null) => {
      const match = url?.match(/^mulist:\/\/share\/([^/?#]+)/);
      if (match?.[1])
        void importSharedSong(decodeURIComponent(match[1])).then(
          refreshLibrary,
        );
    };
    void Linking.getInitialURL().then(openShare);
    const subscription = Linking.addEventListener('url', ({ url }) =>
      openShare(url),
    );
    return () => subscription.remove();
  }, [refreshLibrary]);

  if (selectedSong) {
    return (
      <>
        <StatusBar
          backgroundColor="transparent"
          style={statusStyle}
          translucent
        />
        <PdfViewerScreen
          backLabel={viewerSetlist ? '‹ 셋리스트' : undefined}
          onBack={() => {
            setSelectedSong(null);
            void library.refresh();
          }}
          onSetlistSongSelect={
            viewerSetlist
              ? (song) => {
                  setSelectedSong(song);
                  setViewerSetlist((current) =>
                    current ? { ...current, currentSongId: song.id } : null,
                  );
                }
              : undefined
          }
          onSongUpdate={(updatedSong) => {
            setSelectedSong(updatedSong);
            setViewerSetlist((current) =>
              current
                ? {
                    ...current,
                    songs: current.songs.map((song) =>
                      song.id === updatedSong.id ? updatedSong : song,
                    ),
                  }
                : null,
            );
          }}
          setlist={viewerSetlist?.setlist}
          setlistSongs={viewerSetlist?.songs}
          song={selectedSong}
        />
      </>
    );
  }

  if (isSearchOpen) {
    return (
      <>
        <StatusBar
          backgroundColor="transparent"
          style={statusStyle}
          translucent
        />
        <SearchScreen
          onBack={() => setIsSearchOpen(false)}
          onSongPress={openLibrarySong}
        />
      </>
    );
  }

  if (areSetlistsOpen) {
    return (
      <>
        <StatusBar
          backgroundColor="transparent"
          style={statusStyle}
          translucent
        />
        <SetlistsScreen
          initialSetlistId={viewerSetlist?.setlist.id}
          initialSong={viewerSetlist?.songs.find(
            (song) => song.id === viewerSetlist.currentSongId,
          )}
          onBack={() => {
            setAreSetlistsOpen(false);
            setViewerSetlist(null);
          }}
          onOpenViewer={(song, setlist, songs) => {
            setViewerSetlist({ currentSongId: song.id, setlist, songs });
            setSelectedSong(song);
          }}
        />
      </>
    );
  }

  if (isSocialOpen) {
    return (
      <>
        <StatusBar
          backgroundColor="transparent"
          style={statusStyle}
          translucent
        />
        <SocialScreen onBack={() => setIsSocialOpen(false)} />
      </>
    );
  }

  if (areSettingsOpen) {
    return (
      <>
        <StatusBar
          backgroundColor="transparent"
          style={statusStyle}
          translucent
        />
        <SettingsScreen onClose={() => setAreSettingsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor="transparent"
        style={statusStyle}
        translucent
      />
      <LibraryScreen
        error={library.error}
        isImporting={library.isImporting}
        isLoading={library.isLoading}
        isRefreshing={library.isRefreshing}
        notice={library.notice}
        onFavoritePress={library.toggleFavorite}
        onMetadataSave={library.updateMetadata}
        onPermanentDeletePress={library.deletePermanently}
        onImportPress={library.importPdfs}
        onImageImport={library.importImages}
        onImagePick={library.pickImages}
        onRestorePress={library.restore}
        onRefresh={() => void library.refreshFromCloud()}
        onSearchPress={() => setIsSearchOpen(true)}
        onSharePress={library.shareSong}
        onSetlistsPress={() => {
          setViewerSetlist(null);
          setAreSetlistsOpen(true);
        }}
        onSettingsPress={() => setAreSettingsOpen(true)}
        onSocialPress={() => setIsSocialOpen(true)}
        onSongPress={openLibrarySong}
        onTagSelect={library.selectTag}
        onSyncPress={library.syncSong}
        onTrashPress={library.moveToTrash}
        onViewSelect={library.selectView}
        selectedTag={library.selectedTag}
        songs={library.songs}
        tags={library.tags}
        view={library.view}
      />
    </>
  );
}
