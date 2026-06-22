import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { useMetronome } from '../hooks/useMetronome';

interface MusicControlsProps {
  initialBpm: number | null;
  onBpmChange: (bpm: number) => void;
}

export function MusicControls({ initialBpm, onBpmChange }: MusicControlsProps) {
  const [bpm, setBpm] = useState(initialBpm ?? 120);
  const [bpmText, setBpmText] = useState(String(initialBpm ?? 120));
  const metronome = useMetronome(bpm);

  useEffect(() => {
    const nextBpm = initialBpm ?? 120;
    setBpm(nextBpm);
    setBpmText(String(nextBpm));
  }, [initialBpm]);

  const updateBpm = (value: string) => {
    const next = Math.max(30, Math.min(300, Number.parseInt(value, 10) || 120));
    setBpm(next);
    setBpmText(String(next));
    onBpmChange(next);
  };

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="BPM"
        keyboardType="number-pad"
        onChangeText={setBpmText}
        onEndEditing={(event) => updateBpm(event.nativeEvent.text)}
        style={styles.bpm}
        value={bpmText}
      />
      <Text style={styles.unit}>BPM</Text>
      <Pressable
        onPress={metronome.toggle}
        style={[styles.button, metronome.isPlaying && styles.active]}
      >
        <Text style={[styles.label, metronome.isPlaying && styles.activeLabel]}>
          {metronome.isPlaying ? '정지' : '메트로놈'}
        </Text>
      </Pressable>
      <Pressable onPress={metronome.countIn} style={styles.button}>
        <Text style={styles.label}>{metronome.countInBeat ?? 'Count In'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  bpm: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1,
    color: colors.text,
    fontSize: 12,
    padding: 5,
    textAlign: 'center',
    width: 44,
  },
  unit: { color: colors.muted, fontSize: 11, marginRight: 4 },
  button: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 7 },
  active: { backgroundColor: colors.primary },
  label: { color: colors.text, fontSize: 11, fontWeight: '700' },
  activeLabel: { color: colors.surface },
});
