import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Song } from '../../../domain/models';
import { FilterChip } from '../../../shared/components/FilterChip';
import { colors } from '../../../shared/theme/colors';
import { LibraryEmptyState } from '../components/LibraryEmptyState';
import { LibraryHeader } from '../components/LibraryHeader';
import { SongListItem } from '../components/SongListItem';
import type { LibraryView } from '../types';

interface LibraryScreenProps {
  error: string | null;
  isImporting: boolean;
  isLoading: boolean;
  notice: string | null;
  onFavoritePress: (song: Song) => void;
  songs: readonly Song[];
  tags: readonly string[];
  view: LibraryView;
  selectedTag: string | null;
  onImportPress?: () => void;
  onRestorePress: (song: Song) => void;
  onSearchPress: () => void;
  onSetlistsPress: () => void;
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
  songs,
  tags,
  view,
  selectedTag,
  onImportPress = doNothing,
  onRestorePress,
  onSearchPress,
  onSetlistsPress,
  onSettingsPress,
  onTagSelect,
  onTrashPress,
  onViewSelect,
  onSongPress = doNothing,
}: LibraryScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LibraryHeader
          isImporting={isImporting}
          onImportPress={onImportPress}
          onSearchPress={onSearchPress}
          onSetlistsPress={onSetlistsPress}
          onSettingsPress={onSettingsPress}
          songCount={songs.length}
        />

        <ScrollView
          contentContainerStyle={styles.filters}
          horizontal
          showsHorizontalScrollIndicator={false}
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
          >
            {tags.map((tag) => (
              <FilterChip
                key={tag}
                label={`#${tag}`}
                onPress={() => onTagSelect(tag)}
                selected={selectedTag === tag}
              />
            ))}
          </ScrollView>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <FlatList
          contentContainerStyle={[
            styles.listContent,
            songs.length === 0 && styles.emptyListContent,
          ]}
          data={songs}
          ItemSeparatorComponent={ListSeparator}
          keyExtractor={(song) => song.id}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.loading}
              />
            ) : (
              <LibraryEmptyState {...getEmptyState(view, onImportPress)} />
            )
          }
          renderItem={({ item }) => (
            <SongListItem
              isTrash={view === 'trash'}
              onFavoritePress={onFavoritePress}
              onPress={onSongPress}
              onRestorePress={onRestorePress}
              onTrashPress={onTrashPress}
              song={item}
            />
          )}
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
    paddingBottom: 20,
  },
  tagFilters: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 18,
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
