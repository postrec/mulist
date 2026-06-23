import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Song } from '../../../domain/models';
import { FilterChip } from '../../../shared/components/FilterChip';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { SCREEN_HEADER_HEIGHT } from '../../../shared/layout/metrics';
import { SongListItem } from '../../library/components/SongListItem';
import { useSongSearch } from '../hooks/useSongSearch';
import type { SearchScope } from '../types';

interface SearchScreenProps {
  onBack: () => void;
  onSongPress: (song: Song) => void;
}

const doNothing = () => undefined;

export function SearchScreen({ onBack, onSongPress }: SearchScreenProps) {
  useAppLanguage();
  const search = useSongSearch();
  const scopes: readonly { label: string; value: SearchScope }[] = [
    { label: t('search.all'), value: 'all' },
    { label: t('search.titleScope'), value: 'title' },
    { label: t('search.artist'), value: 'artist' },
    { label: t('search.tag'), value: 'tag' },
    { label: t('search.ocr'), value: 'ocr' },
  ];
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack}>
            <Text style={styles.back}>{t('common.backToLibrary')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('search.title')}</Text>
          <View style={styles.spacer} />
        </View>
        <TextInput
          autoFocus
          onChangeText={search.setQuery}
          placeholder={t('search.placeholder')}
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
                  ? t('search.emptyResults')
                  : t('search.emptyQuery')}
              </Text>
            }
            renderItem={({ item }) => (
              <SongListItem
                onFavoritePress={doNothing}
                onPress={onSongPress}
                onRestorePress={doNothing}
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
    height: SCREEN_HEADER_HEIGHT,
    justifyContent: 'space-between',
  },
  back: { color: colors.primary, fontSize: 15, fontWeight: '700', width: 120 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
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
