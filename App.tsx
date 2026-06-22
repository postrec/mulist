import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import type { Song } from './src/domain/models';
import { useLibrary } from './src/features/library/hooks/useLibrary';
import { LibraryScreen } from './src/features/library/screens/LibraryScreen';
import { PdfViewerScreen } from './src/features/pdf-viewer/screens/PdfViewerScreen';
import { SearchScreen } from './src/features/search/screens/SearchScreen';
import { SetlistsScreen } from './src/features/setlists/screens/SetlistsScreen';
import { SettingsScreen } from './src/features/settings/screens/SettingsScreen';
import { AppSettingsProvider } from './src/features/settings/context/AppSettingsContext';

export default function App() {
  return (
    <AppSettingsProvider>
      <AppContent />
    </AppSettingsProvider>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();
  const statusStyle = colorScheme === 'dark' ? 'light' : 'dark';
  const library = useLibrary();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [areSetlistsOpen, setAreSetlistsOpen] = useState(false);
  const [areSettingsOpen, setAreSettingsOpen] = useState(false);

  if (selectedSong) {
    return (
      <>
        <StatusBar style={statusStyle} />
        <PdfViewerScreen
          onBack={() => {
            setSelectedSong(null);
            void library.refresh();
          }}
          onSongUpdate={setSelectedSong}
          song={selectedSong}
        />
      </>
    );
  }

  if (isSearchOpen) {
    return (
      <>
        <StatusBar style={statusStyle} />
        <SearchScreen
          onBack={() => setIsSearchOpen(false)}
          onSongPress={setSelectedSong}
        />
      </>
    );
  }

  if (areSetlistsOpen) {
    return <SetlistsScreen onBack={() => setAreSetlistsOpen(false)} />;
  }

  if (areSettingsOpen) {
    return <SettingsScreen onClose={() => setAreSettingsOpen(false)} />;
  }

  return (
    <>
      <StatusBar style={statusStyle} />
      <LibraryScreen
        error={library.error}
        isImporting={library.isImporting}
        isLoading={library.isLoading}
        notice={library.notice}
        onFavoritePress={library.toggleFavorite}
        onImportPress={library.importPdfs}
        onRestorePress={library.restore}
        onSearchPress={() => setIsSearchOpen(true)}
        onSetlistsPress={() => setAreSetlistsOpen(true)}
        onSettingsPress={() => setAreSettingsOpen(true)}
        onSongPress={setSelectedSong}
        onTagSelect={library.selectTag}
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
