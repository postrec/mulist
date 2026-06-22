import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { useAppSettings } from '../context/AppSettingsContext';
import type {
  FontSizePreference,
  ThemePreference,
} from '../domain/AppSettings';

const themes: readonly { label: string; value: ThemePreference }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];
const fontSizes: readonly { label: string; value: FontSizePreference }[] = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];
const zooms = [
  { label: '90%', value: 0.9 },
  { label: '100%', value: 1 },
  { label: '125%', value: 1.25 },
] as const;

export function DisplaySettingsScreen() {
  const { settings, update } = useAppSettings();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SettingSection
        description="앱의 기본 색상 모드를 선택합니다."
        title="Theme"
      >
        <ChoiceGroup
          choices={themes}
          onChange={(theme) => void update({ theme })}
          value={settings.theme}
        />
      </SettingSection>
      <SettingSection
        description="목록과 설정 화면에서 사용할 글자 크기입니다."
        title="Font Size"
      >
        <ChoiceGroup
          choices={fontSizes}
          onChange={(fontSize) => void update({ fontSize })}
          value={settings.fontSize}
        />
      </SettingSection>
      <SettingSection
        description="PDF를 열 때 적용할 기본 확대 비율입니다."
        title="Default Zoom"
      >
        <ChoiceGroup
          choices={zooms}
          onChange={(defaultZoom) => void update({ defaultZoom })}
          value={settings.defaultZoom}
        />
      </SettingSection>
      <SwitchRow
        description="악보 가장자리의 빈 여백을 자동으로 줄입니다."
        label="Auto Crop Margin"
        onChange={(autoCropMargin) => void update({ autoCropMargin })}
        value={settings.autoCropMargin}
      />
      <SwitchRow
        description="PDF Viewer를 가로 방향으로 고정합니다."
        label="Landscape Lock"
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
