import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Song } from '../../../domain/models';
import { FilterChip } from '../../../shared/components/FilterChip';
import { colors } from '../../../shared/theme/colors';
import { SongListItem } from '../../library/components/SongListItem';
import { useSongSearch } from '../hooks/useSongSearch';
import type { SearchScope } from '../types';

interface SearchScreenProps {
  onBack: () => void;
  onSongPress: (song: Song) => void;
}

const scopes: readonly { label: string; value: SearchScope }[] = [
  { label: '전체', value: 'all' },
  { label: '제목', value: 'title' },
  { label: '아티스트', value: 'artist' },
  { label: '태그', value: 'tag' },
  { label: 'OCR', value: 'ocr' },
];
const doNothing = () => undefined;

export function SearchScreen({ onBack, onSongPress }: SearchScreenProps) {
  const search = useSongSearch();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack}>
            <Text style={styles.back}>‹ 라이브러리</Text>
          </Pressable>
          <Text style={styles.title}>검색</Text>
          <View style={styles.spacer} />
        </View>
        <TextInput
          autoFocus
          onChangeText={search.setQuery}
          placeholder="곡, 아티스트, 태그, 악보 내용 검색"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={search.query}
        />
        <View style={styles.scopes}>
          {scopes.map((scope) => (
            <FilterChip
              key={scope.value}
              label={scope.label}
              onPress={() => search.setScope(scope.value)}
              selected={search.scope === scope.value}
            />
          ))}
        </View>
        {search.error ? <Text style={styles.error}>{search.error}</Text> : null}
        {search.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <FlatList
            contentContainerStyle={styles.list}
            data={search.results}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(song) => song.id}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {search.query
                  ? '검색 결과가 없습니다.'
                  : '검색어를 입력하세요.'}
              </Text>
            }
            renderItem={({ item }) => (
              <SongListItem
                onFavoritePress={doNothing}
                onPress={onSongPress}
                onRestorePress={doNothing}
                onTrashPress={doNothing}
                song={item}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 960,
    paddingHorizontal: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 22,
  },
  back: { color: colors.primary, fontSize: 15, fontWeight: '700', width: 120 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  spacer: { width: 120 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    padding: 15,
  },
  scopes: { flexDirection: 'row', gap: 8, paddingVertical: 16 },
  list: { flexGrow: 1, paddingBottom: 28 },
  separator: { height: 12 },
  empty: { color: colors.muted, marginTop: 64, textAlign: 'center' },
  error: { color: '#9A3428', paddingBottom: 12 },
});
