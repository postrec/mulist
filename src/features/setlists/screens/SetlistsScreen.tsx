import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import type { Setlist, Song } from '../../../domain/models';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { SCREEN_HEADER_HEIGHT } from '../../../shared/layout/metrics';
import { useSetlists } from '../hooks/useSetlists';
import { SetlistScorePreview } from '../components/SetlistScorePreview';
import { SetlistSongRow } from '../components/SetlistSongRow';
import { SetlistMembersModal } from '../components/SetlistMembersModal';

interface SetlistsScreenProps {
  initialSetlistId?: string;
  initialSong?: Song | null;
  onBack: () => void;
  onOpenViewer: (song: Song, setlist: Setlist, songs: readonly Song[]) => void;
}

export function SetlistsScreen({
  initialSetlistId,
  initialSong = null,
  onBack,
  onOpenViewer,
}: SetlistsScreenProps) {
  useAppLanguage();
  const state = useSetlists();
  const selectedSetlist = state.selected;
  const selectSetlist = state.select;
  const setlists = state.setlists;
  const [previewSong, setPreviewSong] = useState<Song | null>(initialSong);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [membersOpen, setMembersOpen] = useState(false);
  const normalizedQuery = libraryQuery.trim().toLocaleLowerCase();
  const available = normalizedQuery
    ? state.librarySongs.filter(
        (song) =>
          !state.songs.some((item) => item.id === song.id) &&
          [song.title, song.artist, ...song.tags].some((value) =>
            value.toLocaleLowerCase().includes(normalizedQuery),
          ),
      )
    : [];

  useEffect(() => {
    if (!initialSetlistId || selectedSetlist) return;
    const initial = setlists.find((item) => item.id === initialSetlistId);
    if (initial) void selectSetlist(initial);
  }, [initialSetlistId, selectedSetlist, selectSetlist, setlists]);
  const promptCreate = () =>
    Alert.prompt(
      t('setlists.create'),
      t('setlists.createPrompt'),
      (title) => title.trim() && void state.create(title.trim()),
    );
  const toggleEdit = async () => {
    if (!state.selected) return;
    if (!isEditing) {
      setDraftTitle(state.selected.title);
      setIsEditing(true);
      return;
    }
    const title = draftTitle.trim();
    if (title && title !== state.selected.title) await state.update({ title });
    setIsEditing(false);
  };
  const promptEvent = () =>
    Alert.prompt(
      t('setlists.editEventName'),
      undefined,
      (eventName) => void state.update({ eventName: eventName.trim() }),
      'plain-text',
      state.selected?.eventName,
    );
  const promptDate = () =>
    Alert.prompt(
      t('setlists.editDate'),
      t('setlists.renameDatePrompt'),
      (eventDate) =>
        eventDate.trim() && void state.update({ eventDate: eventDate.trim() }),
      'plain-text',
      state.selected?.eventDate,
    );
  const confirmDelete = () =>
    Alert.alert(t('setlists.deleteTitle'), t('setlists.deleteConfirm'), [
      { style: 'cancel', text: t('common.cancel') },
      {
        style: 'destructive',
        text: t('common.delete'),
        onPress: () => void state.remove(),
      },
    ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>{t('common.backToLibrary')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('setlists.title')}</Text>
        <Pressable onPress={promptCreate}>
          <Text style={styles.primaryAction}>{t('setlists.create')}</Text>
        </Pressable>
      </View>
      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      <View style={styles.columns}>
        <View style={styles.sidebar}>
          <FlatList
            data={state.setlists}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('setlists.empty')}</Text>
            }
            renderItem={({ item }) => (
              <SetlistRow
                item={item}
                onPress={() => {
                  setPreviewSong(null);
                  setIsEditing(false);
                  setLibraryQuery('');
                  void state.select(item);
                }}
                selected={state.selected?.id === item.id}
              />
            )}
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.detailContent}
          style={styles.detail}
        >
          {state.selected ? (
            <>
              <View style={styles.detailHeader}>
                <View>
                  {isEditing ? (
                    <TextInput
                      autoFocus
                      onChangeText={setDraftTitle}
                      onSubmitEditing={() => void toggleEdit()}
                      style={styles.titleInput}
                      value={draftTitle}
                    />
                  ) : (
                    <Text style={styles.detailTitle}>
                      {state.selected.title}
                    </Text>
                  )}
                  <Text style={styles.meta}>{state.selected.eventDate}</Text>
                </View>
                <View style={styles.actions}>
                  <SmallButton
                    label={isEditing ? '완료' : '수정'}
                    onPress={() => void toggleEdit()}
                  />
                  <SmallButton label="행사" onPress={promptEvent} />
                  <SmallButton
                    label="사용자"
                    onPress={() => setMembersOpen(true)}
                  />
                  <SmallButton label="날짜" onPress={promptDate} />
                  <SmallButton
                    label="PDF"
                    onPress={() => void state.exportPdf()}
                  />
                  <SmallButton
                    destructive
                    label="삭제"
                    onPress={confirmDelete}
                  />
                </View>
              </View>
              <Text style={styles.sectionTitle}>{t('setlists.order')}</Text>
              {state.songs.map((song, index) => (
                <SetlistSongRow
                  count={state.songs.length}
                  editing={isEditing}
                  index={index}
                  key={song.id}
                  onMoveTo={(from, to) => void state.moveSongTo(from, to)}
                  onPress={() => setPreviewSong(song)}
                  selected={previewSong?.id === song.id}
                  song={song}
                />
              ))}
              <Text style={styles.sectionTitle}>
                {t('setlists.addFromLibrary')}
              </Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setLibraryQuery}
                placeholder="제목, 아티스트 또는 태그 검색"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                value={libraryQuery}
              />
              {available.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void state.addSong(item)}
                  style={styles.addRow}
                >
                  <Text style={styles.addLabel}>＋</Text>
                  <Text style={styles.songTitle}>{item.title}</Text>
                  <Text style={styles.meta}>{item.artist}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            <Text style={styles.empty}>{t('setlists.selectedEmpty')}</Text>
          )}
        </ScrollView>
        <View style={styles.preview}>
          {previewSong && state.selected ? (
            <SetlistScorePreview
              onOpenViewer={() =>
                onOpenViewer(previewSong, state.selected!, state.songs)
              }
              song={previewSong}
            />
          ) : null}
        </View>
      </View>
      {state.selected ? (
        <SetlistMembersModal
          onClose={() => setMembersOpen(false)}
          setlistId={state.selected.id}
          visible={membersOpen}
        />
      ) : null}
    </SafeAreaView>
  );
}

function SetlistRow({
  item,
  onPress,
  selected,
}: {
  item: Setlist;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.setlistRow, selected && styles.selectedRow]}
    >
      <Text style={styles.songTitle}>{item.title}</Text>
      <Text style={styles.meta}>{item.eventDate}</Text>
    </Pressable>
  );
}

function SmallButton({
  destructive = false,
  label,
  onPress,
}: {
  destructive?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.smallButton}>
      <Text style={[styles.smallLabel, destructive && styles.destructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: SCREEN_HEADER_HEIGHT,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  back: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  primaryAction: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  columns: { flex: 1, flexDirection: 'row' },
  sidebar: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
    padding: 12,
    width: 165,
  },
  detail: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
    width: 300,
  },
  detailContent: { flexGrow: 1, padding: 18 },
  preview: { backgroundColor: colors.background, flex: 1 },
  setlistRow: { borderRadius: 10, padding: 14 },
  selectedRow: { backgroundColor: colors.primarySoft },
  detailHeader: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  detailTitle: { color: colors.text, fontSize: 25, fontWeight: '800' },
  titleInput: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 1,
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    minWidth: 150,
    paddingVertical: 3,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  sectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  songTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  addRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 11,
  },
  addLabel: { color: colors.primary, fontSize: 20 },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  smallButton: { borderRadius: 7, padding: 8 },
  smallLabel: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  destructive: { color: '#A5392D' },
  empty: { color: colors.muted, padding: 24, textAlign: 'center' },
  error: { color: '#9A3428', padding: 12, textAlign: 'center' },
});
