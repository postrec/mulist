import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import type { ScorePageLayout } from '../../../domain/models';

export type PageLayout = ScorePageLayout;

interface ViewerControlsProps {
  layout: PageLayout;
  onLayoutChange: (layout: PageLayout) => void;
  onOpenSettings: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

export function ViewerControls({
  layout,
  onLayoutChange,
  onOpenSettings,
  onZoomIn,
  onZoomOut,
  zoom,
}: ViewerControlsProps) {
  useAppLanguage();
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={t('viewer.zoomOut')}
        onPress={onZoomOut}
        style={styles.button}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>
      <Text accessibilityLabel={`${zoom}%`} style={styles.zoom}>
        {zoom}%
      </Text>
      <Pressable
        accessibilityLabel={t('viewer.zoomIn')}
        onPress={onZoomIn}
        style={styles.button}
      >
        <Text style={styles.symbol}>＋</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          onLayoutChange(layout === 'single' ? 'two-page' : 'single')
        }
        style={[
          styles.wideButton,
          layout === 'two-page' && styles.activeButton,
        ]}
      >
        <Text
          style={[styles.label, layout === 'two-page' && styles.activeLabel]}
        >
          {layout === 'single' ? t('viewer.singlePage') : t('viewer.twoPage')}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenSettings}
        style={styles.wideButton}
      >
        <Text style={styles.label}>{t('viewer.scoreSettings')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  button: {
    alignItems: 'center',
    borderRadius: 7,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  symbol: { color: colors.text, fontSize: 18, fontWeight: '700' },
  zoom: { color: colors.muted, fontSize: 11, textAlign: 'center', width: 38 },
  wideButton: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 7 },
  activeButton: { backgroundColor: colors.primary },
  label: { color: colors.text, fontSize: 11, fontWeight: '700' },
  activeLabel: { color: colors.surface },
});
