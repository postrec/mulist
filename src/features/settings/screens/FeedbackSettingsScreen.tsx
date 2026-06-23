import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { getAppDiagnostics } from '../services/appDiagnostics';

type FeedbackType = 'bug' | 'feature' | 'contact';

export function FeedbackSettingsScreen() {
  useAppLanguage();
  const diagnostics = getAppDiagnostics();
  const send = async (type: FeedbackType) => {
    const body = [
      t('feedback.bodyPrompt'),
      '',
      '--- 진단 정보 ---',
      `App: ${diagnostics.appVersion}`,
      `Build: ${diagnostics.buildNumber}`,
      `Device: ${diagnostics.deviceModel}`,
      `OS: ${diagnostics.osVersion}`,
    ].join('\n');
    const subject =
      type === 'bug'
        ? t('feedback.bugReport')
        : type === 'feature'
          ? t('feedback.featureRequest')
          : t('feedback.contact');
    await Linking.openURL(
      `mailto:?subject=${encodeURIComponent(`[MuList] ${subject}`)}&body=${encodeURIComponent(body)}`,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{t('feedback.intro')}</Text>
      <FeedbackButton
        description={t('feedback.description')}
        label={t('feedback.bugReport')}
        onPress={() => void send('bug')}
      />
      <FeedbackButton
        description={t('feedback.description')}
        label={t('feedback.featureRequest')}
        onPress={() => void send('feature')}
      />
      <FeedbackButton
        description={t('feedback.description')}
        label={t('feedback.contact')}
        onPress={() => void send('contact')}
      />
      <View style={styles.diagnostics}>
        <Text style={styles.diagnosticTitle}>
          {t('feedback.diagnosticsTitle')}
        </Text>
        <Text style={styles.diagnosticText}>
          App {diagnostics.appVersion} ({diagnostics.buildNumber})
        </Text>
        <Text style={styles.diagnosticText}>
          {diagnostics.deviceModel} · {diagnostics.osVersion}
        </Text>
      </View>
    </ScrollView>
  );
}

function FeedbackButton({
  description,
  label,
  onPress,
}: {
  description: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 620,
    padding: 24,
    width: '100%',
  },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  button: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  pressed: { opacity: 0.65 },
  label: { color: colors.text, fontSize: 17, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13, marginTop: 5 },
  diagnostics: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    marginTop: 8,
    padding: 16,
  },
  diagnosticTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  diagnosticText: { color: colors.text, fontSize: 12, lineHeight: 18 },
});
