import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Setlist, Song } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';

interface SetlistQuickPanelProps {
  currentSongId: string;
  onSongPress: (song: Song) => void;
  setlist: Setlist;
  songs: readonly Song[];
}

export function SetlistQuickPanel({
  currentSongId,
  onSongPress,
  setlist,
  songs,
}: SetlistQuickPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.title}>
          {setlist.title}
        </Text>
        <Text style={styles.date}>{setlist.eventDate}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {songs.map((song, index) => {
          const selected = song.id === currentSongId;
          return (
            <Pressable
              key={song.id}
              onPress={() => onSongPress(song)}
              style={[styles.row, selected && styles.selectedRow]}
            >
              <Text style={[styles.order, selected && styles.selectedText]}>
                {index + 1}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.songTitle, selected && styles.selectedText]}
              >
                {song.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    bottom: 16,
    left: 16,
    maxHeight: 270,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    width: 190,
    zIndex: 20,
  },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    padding: 12,
  },
  title: { color: colors.text, fontSize: 14, fontWeight: '800' },
  date: { color: colors.muted, fontSize: 10, marginTop: 2 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  selectedRow: { backgroundColor: colors.primary },
  order: { color: colors.muted, fontSize: 11, fontWeight: '800', width: 23 },
  songTitle: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '700' },
  selectedText: { color: '#FFFFFF' },
});
