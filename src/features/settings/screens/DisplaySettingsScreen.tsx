import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { useAppSettings } from '../context/AppSettingsContext';
import type {
  FontSizePreference,
  ScoreNavigationMode,
  ScorePageLayout,
  ThemePreference,
} from '../domain/AppSettings';

export function DisplaySettingsScreen() {
  useAppLanguage();
  const { settings, update } = useAppSettings();
  const [pencilSmoothing, setPencilSmoothing] = useState(
    settings.applePencilSmoothing,
  );
  useEffect(() => {
    setPencilSmoothing(settings.applePencilSmoothing);
  }, [settings.applePencilSmoothing]);
  const themes: readonly { label: string; value: ThemePreference }[] = [
    { label: t('display.themeLight'), value: 'light' },
    { label: t('display.themeDark'), value: 'dark' },
    { label: t('display.themeSystem'), value: 'system' },
  ];
  const fontSizes: readonly { label: string; value: FontSizePreference }[] = [
    { label: t('display.fontSmall'), value: 'small' },
    { label: t('display.fontMedium'), value: 'medium' },
    { label: t('display.fontLarge'), value: 'large' },
  ];
  const pageLayouts: readonly { label: string; value: ScorePageLayout }[] = [
    { label: t('viewer.singlePage'), value: 'single' },
    { label: t('viewer.twoPage'), value: 'two-page' },
  ];
  const navigationModes: readonly {
    label: string;
    value: ScoreNavigationMode;
  }[] = [
    { label: t('viewer.scroll'), value: 'scroll' },
    { label: t('viewer.snapVertical'), value: 'snap' },
    { label: t('viewer.scrollHorizontal'), value: 'snap-horizontal' },
    { label: t('viewer.snapHorizontal'), value: 'snap-horizontal-page' },
  ];
  const zooms = [
    { label: '90%', value: 0.9 },
    { label: '100%', value: 1 },
    { label: '125%', value: 1.25 },
  ] as const;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SettingSection
        description={t('display.themeDescription')}
        title={t('settings.theme')}
      >
        <ChoiceGroup
          choices={themes}
          onChange={(theme) => void update({ theme })}
          value={settings.theme}
        />
      </SettingSection>
      <SettingSection
        description={t('display.fontSizeDescription')}
        title={t('settings.fontSize')}
      >
        <ChoiceGroup
          choices={fontSizes}
          onChange={(fontSize) => void update({ fontSize })}
          value={settings.fontSize}
        />
      </SettingSection>
      <SettingSection
        description={t('display.pencilSmoothingDescription')}
        title={`${t('display.pencilSmoothing')} · ${pencilSmoothing}`}
      >
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEdge}>0</Text>
          <Slider
            accessibilityLabel={t('display.pencilSmoothing')}
            maximumTrackTintColor="#B8BDB9"
            maximumValue={10}
            minimumTrackTintColor="#4C8A6F"
            minimumValue={0}
            onSlidingComplete={(applePencilSmoothing) =>
              void update({ applePencilSmoothing })
            }
            onValueChange={(value) => setPencilSmoothing(Math.round(value))}
            step={1}
            style={styles.slider}
            thumbTintColor="#285C46"
            value={pencilSmoothing}
          />
          <Text style={styles.sliderEdge}>10</Text>
        </View>
      </SettingSection>
      <SettingSection
        description={t('display.defaultZoomDescription')}
        title={t('settings.defaultZoom')}
      >
        <ChoiceGroup
          choices={zooms}
          onChange={(defaultZoom) => void update({ defaultZoom })}
          value={settings.defaultZoom}
        />
      </SettingSection>
      <SettingSection
        description={t('display.defaultPageLayoutDescription')}
        title={t('settings.defaultPageLayout')}
      >
        <ChoiceGroup
          choices={pageLayouts}
          onChange={(defaultPageLayout) => void update({ defaultPageLayout })}
          value={settings.defaultPageLayout}
        />
      </SettingSection>
      <SettingSection
        description={t('display.defaultNavigationModeDescription')}
        title={t('settings.defaultNavigationMode')}
      >
        <ChoiceGroup
          choices={navigationModes}
          onChange={(defaultNavigationMode) =>
            void update({ defaultNavigationMode })
          }
          value={settings.defaultNavigationMode}
        />
      </SettingSection>
      <SwitchRow
        description={t('display.autoCropDescription')}
        label={t('settings.autoCropMargin')}
        onChange={(autoCropMargin) => void update({ autoCropMargin })}
        value={settings.autoCropMargin}
      />
      <SwitchRow
        description={t('display.landscapeLockDescription')}
        label={t('settings.landscapeLock')}
        onChange={(landscapeLock) => void update({ landscapeLock })}
        value={settings.landscapeLock}
      />
    </ScrollView>
  );
}

function SettingSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {children}
    </View>
  );
}

function SwitchRow({
  description,
  label,
  onChange,
  value,
}: {
  description: string;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        onValueChange={onChange}
        trackColor={{ true: colors.primarySoft }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 14,
    maxWidth: 720,
    padding: 24,
    width: '100%',
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  slider: { flex: 1, height: 40 },
  sliderEdge: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    width: 20,
  },
  sliderRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  switchRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 18,
  },
  switchText: { flex: 1, gap: 4 },
});
