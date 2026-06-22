import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../shared/theme/colors';

interface LibraryHeaderProps {
  isImporting: boolean;
  onImportPress: () => void;
  onSearchPress: () => void;
  onSetlistsPress: () => void;
  onSettingsPress: () => void;
  songCount: number;
}

export function LibraryHeader(props: LibraryHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>MY MUSIC</Text>
        <Text style={styles.title}>라이브러리</Text>
      </View>
      <View style={styles.actions}>
        <Text style={styles.songCount}>{props.songCount}곡</Text>
        <HeaderButton label="검색" onPress={props.onSearchPress} />
        <HeaderButton label="셋리스트" onPress={props.onSetlistsPress} />
        <HeaderButton label="설정" onPress={props.onSettingsPress} />
        <Pressable
          accessibilityRole="button"
          disabled={props.isImporting}
          onPress={props.onImportPress}
          style={({ pressed }) => [
            styles.importButton,
            (pressed || props.isImporting) && styles.pressed,
          ]}
        >
          {props.isImporting ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.importLabel}>PDF 가져오기</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function HeaderButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingTop: 28,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  songCount: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    paddingBottom: 5,
  },
  button: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 11 },
  buttonLabel: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  importButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 106,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  importLabel: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
});
