import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import type { AnnotationTool } from './AnnotationCanvas';

interface PdfToolbarProps {
  onSelect: (tool: AnnotationTool | null) => void;
  selected: AnnotationTool | null;
}

const tools: readonly { label: string; value: AnnotationTool }[] = [
  { label: '펜', value: 'pen' },
  { label: '형광펜', value: 'highlighter' },
  { label: '지우개', value: 'eraser' },
  { label: '텍스트', value: 'text' },
];

export function PdfToolbar({ onSelect, selected }: PdfToolbarProps) {
  return (
    <View style={styles.toolbar}>
      {tools.map((tool) => (
        <Pressable
          accessibilityRole="button"
          key={tool.value}
          onPress={() => onSelect(selected === tool.value ? null : tool.value)}
          style={[
            styles.button,
            selected === tool.value && styles.selectedButton,
          ]}
        >
          <Text
            style={[
              styles.label,
              selected === tool.value && styles.selectedLabel,
            ]}
          >
            {tool.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: 3 },
  button: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 7 },
  selectedButton: { backgroundColor: colors.primary },
  label: { color: colors.text, fontSize: 11, fontWeight: '700' },
  selectedLabel: { color: colors.surface },
});
