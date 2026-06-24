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
  ScrollView,
} from 'react-native';

import type { Song } from '../../../domain/models';
import { colors } from '../../../shared/theme/colors';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { reportError } from '../../../shared/logging/reportError';
import {
  getTagLabel,
  getTagPresets,
  normalizeTagIds,
} from '../../../domain/tagPresets';

export interface ScoreMetadata {
  artist: string;
  bpm: number | null;
  title: string;
  tags: readonly string[];
}

interface ScoreSettingsModalProps {
  heading?: string;
  onClose: () => void;
  onSave: (metadata: ScoreMetadata) => Promise<void>;
  song: Song;
  visible: boolean;
}

export function ScoreSettingsModal({
  heading,
  onClose,
  onSave,
  song,
  visible,
}: ScoreSettingsModalProps) {
  useAppLanguage();
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [bpm, setBpm] = useState(song.bpm === null ? '' : String(song.bpm));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tags, setTags] = useState<readonly string[]>(
    normalizePresetTagIds(song.tags),
  );

  useEffect(() => {
    if (!visible) return;
    setTitle(song.title);
    setArtist(song.artist);
    setBpm(song.bpm === null ? '' : String(song.bpm));
    setError(null);
    setTags(normalizePresetTagIds(song.tags));
  }, [song, visible]);

  const save = async () => {
    const trimmedTitle = title.trim();
    const trimmedBpm = bpm.trim();
    const parsedBpm =
      trimmedBpm === '' ? null : Number.parseInt(trimmedBpm, 10);
    if (!trimmedTitle) {
      setError(t('score.titleRequired'));
      return;
    }
    if (
      parsedBpm !== null &&
      (Number.isNaN(parsedBpm) || parsedBpm < 30 || parsedBpm > 300)
    ) {
      setError(t('score.bpmInvalid'));
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        artist: artist.trim(),
        bpm: parsedBpm,
        title: trimmedTitle,
        tags,
      });
      onClose();
    } catch (saveError: unknown) {
      reportError('곡 정보 저장 실패', saveError);
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.heading}>{heading ?? t('score.settings')}</Text>
            <Field
              label={t('score.title')}
              onChangeText={setTitle}
              value={title}
            />
            <Field
              label={t('score.artist')}
              onChangeText={setArtist}
              value={artist}
            />
            <Field
              keyboardType="number-pad"
              label="BPM (30~300)"
              onChangeText={setBpm}
              placeholder={t('score.bpmUnset')}
              value={bpm}
            />
            <Text style={styles.fieldLabel}>{t('score.tags')}</Text>
            <View style={styles.tags}>
              {getTagPresets().map((preset) => {
                const selected = tags.includes(preset.id);
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() =>
                      setTags((current) =>
                        selected
                          ? current.filter((tag) => tag !== preset.id)
                          : [...current, preset.id],
                      )
                    }
                    style={[styles.tag, selected && styles.selectedTag]}
                  >
                    <Text
                      style={[
                        styles.tagLabel,
                        selected && styles.selectedTagLabel,
                      ]}
                    >
                      {getTagLabel(preset.id)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.tagAliases,
                        selected && styles.selectedTagAlias,
                      ]}
                    >
                      {preset.aliases.slice(0, 2).join(' · ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable
                disabled={isSaving}
                onPress={onClose}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryLabel}>{t('score.cancel')}</Text>
              </Pressable>
              <Pressable
                disabled={isSaving}
                onPress={() => void save()}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryLabel}>
                  {isSaving ? t('score.saving') : t('score.save')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
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

function normalizePresetTagIds(values: readonly string[]): readonly string[] {
  const presetIds = new Set(getTagPresets().map((preset) => preset.id));
  return normalizeTagIds(values).filter((tag) => presetIds.has(tag));
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
    maxHeight: '90%',
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
    marginTop: 7,
  },
  tag: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  selectedTag: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  tagAliases: { color: colors.muted, fontSize: 9, marginTop: 2, maxWidth: 110 },
  selectedTagAlias: { color: 'rgba(255,255,255,0.75)' },
  selectedTagLabel: { color: colors.surface },
});
