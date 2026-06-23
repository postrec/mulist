import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Song } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';
import { getTagLabel } from '../../../domain/tagPresets';

interface SongListItemProps {
  isTrash?: boolean;
  onFavoritePress: (song: Song) => void;
  onLongPress?: (song: Song) => void;
  song: Song;
  onPress: (song: Song) => void;
  onRestorePress: (song: Song) => void;
}

export function SongListItem({
  isTrash = false,
  onFavoritePress,
  onLongPress,
  song,
  onPress,
  onRestorePress,
}: SongListItemProps) {
  const detail = [song.artist, song.preferredKey, song.bpm && `${song.bpm} BPM`]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={`${song.title}, ${song.artist}`}
        accessibilityRole="button"
        onPress={() => onPress(song)}
        onLongPress={() => onLongPress?.(song)}
        style={({ pressed }) => [styles.songButton, pressed && styles.pressed]}
      >
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailLabel}>PDF</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            {song.syncStatus !== 'synced' ? (
              <MaterialCommunityIcons
                accessibilityLabel="동기화되지 않음"
                color={colors.muted}
                name="cloud-outline"
                size={17}
              />
            ) : null}
            <Text numberOfLines={1} style={styles.title}>
              {song.title}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.detail}>
            {detail}
          </Text>
          {song.tags.length > 0 ? (
            <Text numberOfLines={1} style={styles.tags}>
              {song.tags.map((tag) => `#${getTagLabel(tag)}`).join('  ')}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        {isTrash ? (
          <ActionButton label="복원" onPress={() => onRestorePress(song)} />
        ) : (
          <ActionButton
            emphasized={song.favorite}
            label={song.favorite ? '★' : '☆'}
            onPress={() => onFavoritePress(song)}
          />
        )}
      </View>
    </View>
  );
}

interface ActionButtonProps {
  accessibilityLabel?: string;
  emphasized?: boolean;
  label: string;
  onPress: () => void;
}

function ActionButton({
  accessibilityLabel,
  emphasized = false,
  label,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Text
        style={[
          styles.actionLabel,
          (label === '★' || label === '☆') && styles.starAction,
          emphasized && styles.emphasizedAction,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  songButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.72,
  },
  thumbnail: {
    alignItems: 'center',
    aspectRatio: 0.74,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    justifyContent: 'center',
    width: 52,
  },
  thumbnailLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    gap: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  detail: {
    color: colors.muted,
    fontSize: 14,
  },
  tags: {
    color: colors.primary,
    fontSize: 13,
  },
  action: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 10,
  },
  actionLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  emphasizedAction: {
    color: colors.accent,
  },
  starAction: { fontSize: 24 },
});
