import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';

interface SettingsRowProps {
  detail?: string;
  label: string;
  onPress: () => void;
}

export function SettingsRow({ detail, label, onPress }: SettingsRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: 18,
  },
  pressed: { opacity: 0.65 },
  content: { flex: 1 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  detail: { color: colors.muted, fontSize: 12, marginTop: 3 },
  chevron: { color: colors.muted, fontSize: 27 },
});
