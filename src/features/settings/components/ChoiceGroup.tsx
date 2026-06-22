import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';

interface Choice<T extends string | number> {
  label: string;
  value: T;
}

interface ChoiceGroupProps<T extends string | number> {
  choices: readonly Choice<T>[];
  onChange: (value: T) => void;
  value: T;
}

export function ChoiceGroup<T extends string | number>({
  choices,
  onChange,
  value,
}: ChoiceGroupProps<T>) {
  return (
    <View style={styles.group}>
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={choice.value}
            onPress={() => onChange(choice.value)}
            style={[styles.choice, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {choice.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    flexDirection: 'row',
    padding: 3,
  },
  choice: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selected: { backgroundColor: colors.surface },
  label: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  selectedLabel: { color: colors.primary },
});
