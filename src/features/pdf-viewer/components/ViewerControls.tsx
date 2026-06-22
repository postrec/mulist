import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';

export type PageLayout = 'single' | 'two-page';

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
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="축소"
        onPress={onZoomOut}
        style={styles.button}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>
      <Text accessibilityLabel={`확대 비율 ${zoom}%`} style={styles.zoom}>
        {zoom}%
      </Text>
      <Pressable
        accessibilityLabel="확대"
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
          {layout === 'single' ? '1쪽' : '2쪽'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenSettings}
        style={styles.wideButton}
      >
        <Text style={styles.label}>악보 설정</Text>
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
