import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';

interface LibraryHeaderProps {
  isImporting: boolean;
  onImportPress: () => void;
  onSearchPress: () => void;
  onSocialPress: () => void;
  onSetlistsPress: () => void;
  onSettingsPress: () => void;
  songCount: number;
}

export function LibraryHeader(props: LibraryHeaderProps) {
  useAppLanguage();
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>MULIST</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('library.title')}</Text>
          <Text style={styles.songCount}>{props.songCount} songs</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <HeaderButton
          large
          label={t('library.search')}
          onPress={props.onSearchPress}
          symbol="⌕"
        />
        <HeaderButton
          large
          label={t('library.setlists')}
          onPress={props.onSetlistsPress}
          symbol="≡"
        />
        <HeaderButton
          large
          label="친구"
          onPress={props.onSocialPress}
          symbol="♧"
        />
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
            <Text style={styles.importLabel}>{t('library.importPdf')}</Text>
          )}
        </Pressable>
        <HeaderButton
          label={t('library.settings')}
          onPress={props.onSettingsPress}
          symbol="⚙"
        />
      </View>
    </View>
  );
}

function HeaderButton({
  large = false,
  label,
  onPress,
  symbol,
}: {
  large?: boolean;
  label: string;
  onPress: () => void;
  symbol: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.buttonLabel}>
        <Text style={large ? styles.largeSymbol : styles.symbol}>{symbol}</Text>{' '}
        {label}
      </Text>
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
  titleRow: { alignItems: 'baseline', flexDirection: 'row', gap: 8 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  songCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  button: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 11 },
  buttonLabel: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  symbol: { fontSize: 16 },
  largeSymbol: { fontSize: 28, lineHeight: 28 },
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
