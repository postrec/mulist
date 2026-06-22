import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Setlist } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';
import { useSetlists } from '../hooks/useSetlists';

interface SetlistsScreenProps {
  onBack: () => void;
}

export function SetlistsScreen({ onBack }: SetlistsScreenProps) {
  const state = useSetlists();
  const available = state.librarySongs.filter(
    (song) => !state.songs.some((item) => item.id === song.id),
  );
  const promptCreate = () =>
    Alert.prompt(
      '새 셋리스트',
      '셋리스트 이름을 입력하세요.',
      (title) => title.trim() && void state.create(title.trim()),
    );
  const promptUpdate = () =>
    Alert.prompt(
      '이름 수정',
      undefined,
      (title) => title.trim() && void state.update({ title: title.trim() }),
      'plain-text',
      state.selected?.title,
    );
  const promptEvent = () =>
    Alert.prompt(
      '행사명 수정',
      undefined,
      (eventName) => void state.update({ eventName: eventName.trim() }),
      'plain-text',
      state.selected?.eventName,
    );
  const promptDate = () =>
    Alert.prompt(
      '날짜 수정',
      'YYYY-MM-DD',
      (eventDate) =>
        eventDate.trim() && void state.update({ eventDate: eventDate.trim() }),
      'plain-text',
      state.selected?.eventDate,
    );
  const confirmDelete = () =>
    Alert.alert('셋리스트 삭제', '이 셋리스트를 삭제할까요?', [
      { style: 'cancel', text: '취소' },
      {
        style: 'destructive',
        text: '삭제',
        onPress: () => void state.remove(),
      },
    ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹ 라이브러리</Text>
        </Pressable>
        <Text style={styles.title}>셋리스트</Text>
        <Pressable onPress={promptCreate}>
          <Text style={styles.primaryAction}>새로 만들기</Text>
        </Pressable>
      </View>
      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      <View style={styles.columns}>
        <View style={styles.sidebar}>
          <FlatList
            data={state.setlists}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>셋리스트가 없습니다.</Text>
            }
            renderItem={({ item }) => (
              <SetlistRow
                item={item}
                onPress={() => void state.select(item)}
                selected={state.selected?.id === item.id}
              />
            )}
          />
        </View>
        <View style={styles.detail}>
          {state.selected ? (
            <>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailTitle}>{state.selected.title}</Text>
                  <Text style={styles.meta}>{state.selected.eventDate}</Text>
                </View>
                <View style={styles.actions}>
                  <SmallButton label="수정" onPress={promptUpdate} />
                  <SmallButton label="행사" onPress={promptEvent} />
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
              <Text style={styles.sectionTitle}>곡 순서</Text>
              {state.songs.map((song, index) => (
                <View key={song.id} style={styles.songRow}>
                  <Text style={styles.order}>{index + 1}</Text>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.meta}>{song.artist}</Text>
                  </View>
                  <SmallButton
                    label="↑"
                    onPress={() => void state.moveSong(index, -1)}
                  />
                  <SmallButton
                    label="↓"
                    onPress={() => void state.moveSong(index, 1)}
                  />
                </View>
              ))}
              <Text style={styles.sectionTitle}>라이브러리에서 추가</Text>
              <FlatList
                data={available}
                keyExtractor={(song) => song.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => void state.addSong(item)}
                    style={styles.addRow}
                  >
                    <Text style={styles.addLabel}>＋</Text>
                    <Text style={styles.songTitle}>{item.title}</Text>
                    <Text style={styles.meta}>{item.artist}</Text>
                  </Pressable>
                )}
              />
            </>
          ) : (
            <Text style={styles.empty}>
              셋리스트를 선택하거나 새로 만드세요.
            </Text>
          )}
        </View>
      </View>
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
    justifyContent: 'space-between',
    padding: 20,
  },
  back: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  primaryAction: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  columns: { flex: 1, flexDirection: 'row' },
  sidebar: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
    padding: 12,
    width: 280,
  },
  detail: { flex: 1, padding: 24 },
  setlistRow: { borderRadius: 10, padding: 14 },
  selectedRow: { backgroundColor: colors.primarySoft },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailTitle: { color: colors.text, fontSize: 25, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 5 },
  sectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  songRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 7,
    padding: 10,
  },
  order: { color: colors.muted, fontWeight: '700', width: 30 },
  songInfo: { flex: 1 },
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
  smallButton: { borderRadius: 7, padding: 8 },
  smallLabel: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  destructive: { color: '#A5392D' },
  empty: { color: colors.muted, padding: 24, textAlign: 'center' },
  error: { color: '#9A3428', padding: 12, textAlign: 'center' },
});
