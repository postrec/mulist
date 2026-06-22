import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';

interface LibraryEmptyStateProps {
  actionLabel?: string;
  description?: string;
  onActionPress?: () => void;
  title?: string;
}

export function LibraryEmptyState({
  actionLabel = 'PDF 가져오기',
  description = 'PDF 악보를 가져오면 곡 중심으로 정리할 수 있어요.',
  onActionPress,
  title = '첫 곡을 추가해 보세요',
}: LibraryEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>♫</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 72,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 20,
    width: 56,
  },
  iconText: {
    color: colors.primary,
    fontSize: 26,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  pressed: {
    opacity: 0.75,
  },
  buttonLabel: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});
