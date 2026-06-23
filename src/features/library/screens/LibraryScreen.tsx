import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import type { Song } from '../../../domain/models';
import { FilterChip } from '../../../shared/components/FilterChip';
import { colors } from '../../../shared/theme/colors';
import { getTagLabel } from '../../../domain/tagPresets';
import { LibraryEmptyState } from '../components/LibraryEmptyState';
import { LibraryHeader } from '../components/LibraryHeader';
import { SongListItem } from '../components/SongListItem';
import { SongActionsModal } from '../components/SongActionsModal';
import { ImageOrderModal } from '../../import/components/ImageOrderModal';
import type { SelectedImageAsset } from '../../import/services/importPdfFiles';
import {
  ScoreSettingsModal,
  type ScoreMetadata,
} from '../../pdf-viewer/components/ScoreSettingsModal';
import type { LibraryView } from '../types';

interface LibraryScreenProps {
  error: string | null;
  isImporting: boolean;
  isLoading: boolean;
  notice: string | null;
  onFavoritePress: (song: Song) => void;
  onMetadataSave: (song: Song, metadata: ScoreMetadata) => Promise<void>;
  onSyncPress: (song: Song) => void;
  onSharePress: (song: Song) => void;
  songs: readonly Song[];
  tags: readonly string[];
  view: LibraryView;
  selectedTag: string | null;
  onImportPress?: () => void;
  onImageImport: (assets: readonly SelectedImageAsset[]) => Promise<void>;
  onImagePick: () => Promise<readonly SelectedImageAsset[] | null>;
  onRestorePress: (song: Song) => void;
  onSearchPress: () => void;
  onSetlistsPress: () => void;
  onSocialPress: () => void;
  onSettingsPress: () => void;
  onTagSelect: (tag: string) => void;
  onTrashPress: (song: Song) => void;
  onViewSelect: (view: LibraryView) => void;
  onSongPress?: (song: Song) => void;
}

const doNothing = () => undefined;
const filters: readonly { label: string; value: LibraryView }[] = [
  { label: '전체', value: 'all' },
  { label: '최근', value: 'recent' },
  { label: '즐겨찾기', value: 'favorites' },
  { label: '태그', value: 'tags' },
  { label: '휴지통', value: 'trash' },
];

export function LibraryScreen({
  error,
  isImporting,
  isLoading,
  notice,
  onFavoritePress,
  onMetadataSave,
  onSyncPress,
  onSharePress,
  songs,
  tags,
  view,
  selectedTag,
  onImportPress = doNothing,
  onImageImport,
  onImagePick,
  onRestorePress,
  onSearchPress,
  onSetlistsPress,
  onSocialPress,
  onSettingsPress,
  onTagSelect,
  onTrashPress,
  onViewSelect,
  onSongPress = doNothing,
}: LibraryScreenProps) {
  const { width } = useWindowDimensions();
  const columnCount = width >= 560 ? 2 : 1;
  const [actionSong, setActionSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [pendingImages, setPendingImages] = useState<
    readonly SelectedImageAsset[]
  >([]);

  const chooseImportSource = () => {
    Alert.alert('악보 가져오기', '가져올 파일 종류를 선택하세요.', [
      { style: 'cancel', text: '취소' },
      { onPress: onImportPress, text: 'PDF 파일' },
      {
        onPress: () => {
          void onImagePick().then((assets) => {
            if (assets && assets.length > 0) setPendingImages(assets);
          });
        },
        text: '갤러리 이미지',
      },
    ]);
  };

  const editSong = (song: Song) => {
    setActionSong(null);
    setEditingSong(song);
  };

  const syncSong = (song: Song) => {
    setActionSong(null);
    onSyncPress(song);
  };

  const shareSong = (song: Song) => {
    setActionSong(null);
    onSharePress(song);
  };

  const confirmDelete = (song: Song) => {
    setActionSong(null);
    Alert.alert('곡 삭제', `${song.title}을(를) 휴지통으로 이동할까요?`, [
      { style: 'cancel', text: '취소' },
      {
        style: 'destructive',
        text: '삭제',
        onPress: () => onTrashPress(song),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LibraryHeader
          isImporting={isImporting}
          onImportPress={chooseImportSource}
          onSearchPress={onSearchPress}
          onSetlistsPress={onSetlistsPress}
          onSocialPress={onSocialPress}
          onSettingsPress={onSettingsPress}
          songCount={songs.length}
        />

        <ScrollView
          contentContainerStyle={styles.filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroller}
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              onPress={() => onViewSelect(filter.value)}
              selected={view === filter.value}
            />
          ))}
        </ScrollView>

        {view === 'tags' && tags.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.tagFilters}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroller}
          >
            {tags.map((tag) => (
              <FilterChip
                key={tag}
                label={`#${getTagLabel(tag)}`}
                onPress={() => onTagSelect(tag)}
                selected={selectedTag === tag}
              />
            ))}
          </ScrollView>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <FlatList
          columnWrapperStyle={columnCount === 2 ? styles.columns : undefined}
          contentContainerStyle={[
            styles.listContent,
            songs.length === 0 && styles.emptyListContent,
          ]}
          data={songs}
          ItemSeparatorComponent={ListSeparator}
          keyExtractor={(song) => song.id}
          key={`library-${columnCount}`}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.loading}
              />
            ) : (
              <LibraryEmptyState {...getEmptyState(view, chooseImportSource)} />
            )
          }
          numColumns={columnCount}
          renderItem={({ item }) => (
            <View
              style={[
                styles.gridItem,
                columnCount === 2 && styles.twoColumnItem,
              ]}
            >
              <SongListItem
                isTrash={view === 'trash'}
                onFavoritePress={onFavoritePress}
                onLongPress={
                  view === 'trash' ? undefined : (song) => setActionSong(song)
                }
                onPress={onSongPress}
                onRestorePress={onRestorePress}
                song={item}
              />
            </View>
          )}
        />
        <SongActionsModal
          onClose={() => setActionSong(null)}
          onDelete={confirmDelete}
          onEdit={editSong}
          onShare={shareSong}
          onSync={syncSong}
          song={actionSong}
        />
        {editingSong ? (
          <ScoreSettingsModal
            heading="곡 정보 수정"
            onClose={() => setEditingSong(null)}
            onSave={(metadata) => onMetadataSave(editingSong, metadata)}
            song={editingSong}
            visible
          />
        ) : null}
        <ImageOrderModal
          assets={pendingImages}
          importing={isImporting}
          onCancel={() => setPendingImages([])}
          onConfirm={(assets) => {
            void onImageImport(assets).then(() => setPendingImages([]));
          }}
          visible={pendingImages.length > 0}
        />
      </View>
    </SafeAreaView>
  );
}

function getEmptyState(view: LibraryView, onImportPress: () => void) {
  switch (view) {
    case 'recent':
      return {
        title: '최근 사용한 곡이 없습니다',
        description: '곡을 열면 여기에 표시됩니다.',
      };
    case 'favorites':
      return {
        title: '즐겨찾기가 없습니다',
        description: '자주 쓰는 곡에 별표를 추가해 보세요.',
      };
    case 'tags':
      return {
        title: '선택한 태그의 곡이 없습니다',
        description: '곡에 태그를 추가하거나 다른 태그를 선택하세요.',
      };
    case 'trash':
      return {
        title: '휴지통이 비어 있습니다',
        description: '삭제한 곡은 30일 동안 보관됩니다.',
      };
    case 'all':
      return { onActionPress: onImportPress };
  }
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 960,
    paddingHorizontal: 24,
    width: '100%',
  },
  filters: {
    gap: 8,
    paddingRight: 24,
    flexDirection: 'row',
    paddingBottom: 10,
  },
  filterScroller: { flexGrow: 0, minHeight: 52 },
  tagFilters: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
    paddingRight: 24,
  },
  error: {
    backgroundColor: '#FBE9E7',
    borderRadius: 10,
    color: '#9A3428',
    marginBottom: 16,
    padding: 12,
  },
  notice: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    color: colors.primary,
    marginBottom: 16,
    padding: 12,
  },
  listContent: {
    paddingBottom: 32,
  },
  columns: { gap: 12 },
  gridItem: { flex: 1 },
  twoColumnItem: { maxWidth: '49.4%' },
  emptyListContent: {
    flexGrow: 1,
  },
  loading: {
    marginTop: 72,
  },
  separator: {
    height: 12,
  },
});
