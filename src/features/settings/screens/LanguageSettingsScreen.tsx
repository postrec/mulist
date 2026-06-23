import { ScrollView, StyleSheet, Text } from 'react-native';

import { ChoiceGroup } from '../components/ChoiceGroup';
import { useAppSettings } from '../context/AppSettingsContext';
import type { AppLanguage } from '../domain/AppSettings';
import { t } from '../../../shared/i18n';
import { colors } from '../../../shared/theme/colors';

const languageChoices: readonly { label: string; value: AppLanguage }[] = [
  { label: '한국어', value: 'ko' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
];

export function LanguageSettingsScreen() {
  const { settings, update } = useAppSettings();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.languageTitle')}</Text>
      <Text style={styles.description}>
        {t('settings.languageDescription')}
      </Text>
      <ChoiceGroup
        choices={languageChoices}
        onChange={(language) => void update({ language })}
        value={settings.language}
      />
      <Text style={styles.current}>
        {t('settings.languageValueLabel')}:{' '}
        {settings.language === 'ko'
          ? t('settings.languageValueKo')
          : settings.language === 'en'
            ? t('settings.languageValueEn')
            : t('settings.languageValueJa')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 720,
    padding: 24,
    width: '100%',
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  current: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
