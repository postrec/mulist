import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Song } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';

interface SongActionsModalProps {
  onClose: () => void;
  onDelete: (song: Song) => void;
  onEdit: (song: Song) => void;
  onSync: (song: Song) => void;
  onShare: (song: Song) => void;
  song: Song | null;
}

export function SongActionsModal({
  onClose,
  onDelete,
  onEdit,
  onSync,
  onShare,
  song,
}: SongActionsModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={song !== null}
    >
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={styles.card}
        >
          <Text numberOfLines={1} style={styles.title}>
            {song?.title}
          </Text>
          <MenuButton
            label="정보 수정"
            onPress={() => {
              if (song) onEdit(song);
            }}
          />
          <MenuButton
            label="동기화"
            onPress={() => {
              if (song) onSync(song);
            }}
          />
          <MenuButton
            label="공유"
            onPress={() => {
              if (song) onShare(song);
            }}
          />
          <View style={styles.divider} />
          <MenuButton
            destructive
            label="삭제"
            onPress={() => {
              if (song) onDelete(song);
            }}
          />
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuButton({
  destructive = false,
  label,
  onPress,
}: {
  destructive?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Text style={[styles.itemText, destructive && styles.destructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    maxWidth: 380,
    overflow: 'hidden',
    padding: 8,
    width: '100%',
  },
  title: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 15 },
  itemText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  destructive: { color: '#C43D36' },
  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth },
  cancel: { alignItems: 'center', marginTop: 6, padding: 13 },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
});
