import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
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
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
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
  isRefreshing: boolean;
  notice: string | null;
  onFavoritePress: (song: Song) => void;
  onMetadataSave: (song: Song, metadata: ScoreMetadata) => Promise<void>;
  onPermanentDeletePress: (song: Song) => void;
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
  onRefresh: () => void;
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
export function LibraryScreen({
  error,
  isImporting,
  isLoading,
  isRefreshing,
  notice,
  onFavoritePress,
  onMetadataSave,
  onPermanentDeletePress,
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
  onRefresh,
  onSearchPress,
  onSetlistsPress,
  onSocialPress,
  onSettingsPress,
  onTagSelect,
  onTrashPress,
  onViewSelect,
  onSongPress = doNothing,
}: LibraryScreenProps) {
  useAppLanguage();
  const filters: readonly { label: string; value: LibraryView }[] = [
    { label: t('library.all'), value: 'all' },
    { label: t('library.recent'), value: 'recent' },
    { label: t('library.favorites'), value: 'favorites' },
    { label: t('library.tags'), value: 'tags' },
    { label: t('library.trash'), value: 'trash' },
  ];
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

  const confirmPermanentDelete = (song: Song) => {
    Alert.alert(
      '곡 완전 삭제',
      `${song.title}과(와) 연결된 PDF 및 클라우드 백업을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
      [
        { style: 'cancel', text: '취소' },
        {
          style: 'destructive',
          text: '완전 삭제',
          onPress: () => onPermanentDeletePress(song),
        },
      ],
    );
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
          alwaysBounceVertical
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
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={onRefresh}
              refreshing={isRefreshing}
              tintColor={colors.primary}
            />
          }
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
                onPermanentDeletePress={confirmPermanentDelete}
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
            heading={t('library.editSong')}
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
        title: t('library.emptyRecentTitle'),
        description: t('library.emptyRecentDescription'),
      };
    case 'favorites':
      return {
        title: t('library.emptyFavoritesTitle'),
        description: t('library.emptyFavoritesDescription'),
      };
    case 'tags':
      return {
        title: t('library.emptyTagsTitle'),
        description: t('library.emptyTagsDescription'),
      };
    case 'trash':
      return {
        title: t('library.emptyTrashTitle'),
        description: t('library.emptyTrashDescription'),
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
