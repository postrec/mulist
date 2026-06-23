import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRef, useState } from 'react';

import type { ScoreNavigationMode } from '../../../domain/models';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import type { AnnotationTool } from './AnnotationCanvas';
import type { PageLayout } from './ViewerControls';

interface ViewerMenuBarProps {
  drawingOpen: boolean;
  layout: PageLayout;
  navigationMode: ScoreNavigationMode;
  onCloseView: () => void;
  onLayoutChange: (layout: PageLayout) => void;
  onNavigationChange: (mode: ScoreNavigationMode) => void;
  onOpenSettings: () => void;
  onToggleDrawing: () => void;
  onToggleView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
  viewOpen: boolean;
}

export function ViewerMenuBar(props: ViewerMenuBarProps) {
  useAppLanguage();
  const viewButton = useRef<View>(null);
  const { width } = useWindowDimensions();
  const [anchor, setAnchor] = useState({ left: 0, top: 48 });
  const toggleView = () => {
    viewButton.current?.measureInWindow((x, y, _width, height) => {
      setAnchor({ left: Math.min(x, width - 270), top: y + height + 4 });
      props.onToggleView();
    });
  };
  return (
    <View style={styles.menuBar}>
      <MenuButton label="−" onPress={props.onZoomOut} />
      <Text style={styles.zoom}>{props.zoom}%</Text>
      <MenuButton label="＋" onPress={props.onZoomIn} />
      <View ref={viewButton}>
        <MenuButton label={t('viewer.view')} onPress={toggleView} />
      </View>
      <MenuButton
        active={props.drawingOpen}
        label={t('viewer.drawing')}
        onPress={props.onToggleDrawing}
      />
      <MenuButton
        label={t('viewer.scoreSettings')}
        onPress={props.onOpenSettings}
      />
      <Modal
        animationType="fade"
        onRequestClose={props.onCloseView}
        transparent
        visible={props.viewOpen}
      >
        <Pressable onPress={props.onCloseView} style={styles.backdrop}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[styles.popover, anchor]}
          >
            <ViewPopover {...props} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface ViewPopoverProps {
  layout: PageLayout;
  navigationMode: ScoreNavigationMode;
  onLayoutChange: (layout: PageLayout) => void;
  onNavigationChange: (mode: ScoreNavigationMode) => void;
}

export function ViewPopover(props: ViewPopoverProps) {
  useAppLanguage();
  return (
    <View>
      <Text style={styles.popoverTitle}>{t('viewer.pageView')}</Text>
      <View style={styles.row}>
        <MenuButton
          active={props.layout === 'single'}
          label={t('viewer.singlePage')}
          onPress={() => props.onLayoutChange('single')}
        />
        <MenuButton
          active={props.layout === 'two-page'}
          label={t('viewer.twoPage')}
          onPress={() => props.onLayoutChange('two-page')}
        />
      </View>
      <Text style={styles.popoverTitle}>{t('viewer.navigationMode')}</Text>
      <View style={styles.row}>
        <MenuButton
          active={props.navigationMode === 'scroll'}
          label={t('viewer.scroll')}
          onPress={() => props.onNavigationChange('scroll')}
        />
        <MenuButton
          active={props.navigationMode === 'snap'}
          label={t('viewer.snapVertical')}
          onPress={() => props.onNavigationChange('snap')}
        />
        <MenuButton
          active={props.navigationMode === 'snap-horizontal'}
          label={t('viewer.scrollHorizontal')}
          onPress={() => props.onNavigationChange('snap-horizontal')}
        />
        <MenuButton
          active={props.navigationMode === 'snap-horizontal-page'}
          label={t('viewer.snapHorizontal')}
          onPress={() => props.onNavigationChange('snap-horizontal-page')}
        />
      </View>
    </View>
  );
}

export function HideMenuButton({ onPress }: { onPress: () => void }) {
  return <MenuButton label={t('viewer.hideMenu')} onPress={onPress} />;
}

interface DrawingToolbarProps {
  color: string;
  onColorSelect: (color: string) => void;
  onSelect: (tool: AnnotationTool | null) => void;
  onWidthSelect: (width: number) => void;
  selected: AnnotationTool | null;
  width: number;
}

const drawingColors = [
  '#1C211D',
  '#C62828',
  '#1565C0',
  '#2E7D32',
  '#FFE066',
  '#7B1FA2',
] as const;

export function DrawingToolbar({
  color,
  onColorSelect,
  onSelect,
  onWidthSelect,
  selected,
  width,
}: DrawingToolbarProps) {
  useAppLanguage();
  const tools = [
    { icon: 'pen' as const, label: t('viewer.pen'), value: 'pen' as const },
    {
      icon: 'highlighter' as const,
      label: t('viewer.highlighter'),
      value: 'highlighter' as const,
    },
    {
      icon: 'eraser' as const,
      label: t('viewer.eraser'),
      value: 'eraser' as const,
    },
  ];
  const canChooseColor = selected === 'pen' || selected === 'highlighter';
  const widthOptions =
    selected === 'highlighter'
      ? ([10, 18, 28] as const)
      : ([2, 3.5, 5] as const);
  return (
    <View style={styles.drawingToolbar}>
      {canChooseColor ? (
        <View style={styles.colorPalette}>
          <View style={styles.widthOptions}>
            {widthOptions.map((item, index) => (
              <Pressable
                accessibilityLabel={`굵기 ${index + 1}단계`}
                accessibilityRole="button"
                key={item}
                onPress={() => onWidthSelect(item)}
                style={[
                  styles.widthButton,
                  width === item && styles.selectedWidthButton,
                ]}
              >
                <View
                  style={[styles.widthSample, { height: [2, 4, 7][index] }]}
                />
              </Pressable>
            ))}
          </View>
          <View style={styles.optionDivider} />
          <View style={styles.colorOptions}>
            {drawingColors.map((item) => (
              <Pressable
                accessibilityLabel={`색상 ${item}`}
                accessibilityRole="button"
                key={item}
                onPress={() => onColorSelect(item)}
                style={[
                  styles.colorButton,
                  { backgroundColor: item },
                  color === item && styles.selectedColor,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
      {tools.map((tool) => (
        <Pressable
          accessibilityLabel={tool.label}
          accessibilityRole="button"
          key={tool.value}
          onPress={() => onSelect(selected === tool.value ? null : tool.value)}
          style={[
            styles.toolButton,
            selected === tool.value && styles.activeButton,
          ]}
        >
          <FontAwesome5
            color={selected === tool.value ? colors.surface : colors.text}
            name={tool.icon}
            size={19}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function ShowMenuButton({ onPress }: { onPress: () => void }) {
  useAppLanguage();
  return (
    <View style={styles.showMenu}>
      <MenuButton label={t('viewer.menu')} onPress={onPress} />
    </View>
  );
}

function MenuButton({
  active = false,
  label,
  onPress,
}: {
  active?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, active && styles.activeButton]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuBar: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'space-around',
  },
  button: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  activeButton: { backgroundColor: colors.primary },
  label: { color: colors.text, fontSize: 11, fontWeight: '700' },
  activeLabel: { color: colors.surface },
  zoom: { color: colors.muted, fontSize: 11, textAlign: 'center', width: 38 },
  popover: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
    position: 'absolute',
    width: 260,
  },
  backdrop: { flex: 1 },
  popoverTitle: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  drawingToolbar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    bottom: 20,
    gap: 4,
    padding: 6,
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  colorPalette: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    bottom: 140,
    gap: 8,
    padding: 8,
    position: 'absolute',
    right: 0,
  },
  widthOptions: { alignItems: 'center', gap: 4 },
  widthButton: {
    alignItems: 'center',
    borderRadius: 7,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  selectedWidthButton: { backgroundColor: colors.primarySoft },
  widthSample: {
    backgroundColor: colors.text,
    borderRadius: 4,
    width: 22,
  },
  optionDivider: { backgroundColor: colors.border, height: 1, width: '100%' },
  colorOptions: { alignItems: 'center', gap: 8 },
  colorButton: {
    borderColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    width: 24,
  },
  selectedColor: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  toolButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  showMenu: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    position: 'absolute',
    right: 12,
    top: 8,
    zIndex: 30,
  },
});
