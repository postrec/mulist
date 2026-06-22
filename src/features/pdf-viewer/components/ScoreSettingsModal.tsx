import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Song } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';

export interface ScoreMetadata {
  artist: string;
  bpm: number | null;
  title: string;
}

interface ScoreSettingsModalProps {
  onClose: () => void;
  onSave: (metadata: ScoreMetadata) => Promise<void>;
  song: Song;
  visible: boolean;
}

export function ScoreSettingsModal({
  onClose,
  onSave,
  song,
  visible,
}: ScoreSettingsModalProps) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [bpm, setBpm] = useState(song.bpm === null ? '' : String(song.bpm));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(song.title);
    setArtist(song.artist);
    setBpm(song.bpm === null ? '' : String(song.bpm));
    setError(null);
  }, [song, visible]);

  const save = async () => {
    const trimmedTitle = title.trim();
    const trimmedBpm = bpm.trim();
    const parsedBpm =
      trimmedBpm === '' ? null : Number.parseInt(trimmedBpm, 10);
    if (!trimmedTitle) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (
      parsedBpm !== null &&
      (Number.isNaN(parsedBpm) || parsedBpm < 30 || parsedBpm > 300)
    ) {
      setError('BPM은 30~300 사이로 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        artist: artist.trim(),
        bpm: parsedBpm,
        title: trimmedTitle,
      });
      onClose();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error ? saveError.message : '저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>악보 설정</Text>
          <Field label="제목" onChangeText={setTitle} value={title} />
          <Field label="가수" onChangeText={setArtist} value={artist} />
          <Field
            keyboardType="number-pad"
            label="BPM (30~300)"
            onChangeText={setBpm}
            placeholder="미설정"
            value={bpm}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              disabled={isSaving}
              onPress={onClose}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryLabel}>취소</Text>
            </Pressable>
            <Pressable
              disabled={isSaving}
              onPress={() => void save()}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryLabel}>
                {isSaving ? '저장 중…' : '저장'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface FieldProps {
  keyboardType?: 'default' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}

function Field({
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  value,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    maxWidth: 460,
    padding: 22,
    width: '100%',
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
  },
  field: { gap: 6, marginBottom: 13 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  input: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: '#C84A3D', fontSize: 13, marginBottom: 10 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  secondaryButton: {
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryLabel: { color: colors.text, fontWeight: '700' },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryLabel: { color: colors.surface, fontWeight: '800' },
});
