import { useState } from 'react';
import Slider from '@react-native-community/slider';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { reportError } from '../../../shared/logging/reportError';
import { useAppSettings } from '../context/AppSettingsContext';
import {
  createTestSetlist,
  createTestSong,
  getDatabaseStats,
  getOcrPreview,
  getStorageStats,
  rerunOcr,
  resetLibraryDatabase,
} from '../services/developerTools';

export function DeveloperSettingsScreen() {
  useAppLanguage();
  const { settings, update } = useAppSettings();
  const [result, setResult] = useState('');
  const run = async (operation: () => Promise<string>) => {
    try {
      setResult(await operation());
    } catch (error: unknown) {
      reportError('개발자 도구 실행 실패', error);
      setResult(
        error instanceof Error ? error.message : t('developer.loadingError'),
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.toggleRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>{t('settings.developerMode')}</Text>
          <Text style={styles.detail}>{t('developer.description')}</Text>
        </View>
        <Switch
          onValueChange={(developerMode) => void update({ developerMode })}
          value={settings.developerMode}
        />
      </View>
      {settings.developerMode ? (
        <>
          <ToolSection title="PDF Viewer">
            <Text style={styles.settingTitle}>
              {t('developer.pdfPreviewScale')} ·{' '}
              {Math.round(settings.pdfPreviewScale * 100)}%
            </Text>
            <Text style={styles.detail}>
              {t('developer.pdfPreviewScaleDescription')}
            </Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderEdge}>10%</Text>
              <Slider
                accessibilityLabel={t('developer.pdfPreviewScale')}
                maximumTrackTintColor="#B8BDB9"
                maximumValue={1}
                minimumTrackTintColor="#4C8A6F"
                minimumValue={0.1}
                onSlidingComplete={(pdfPreviewScale) =>
                  void update({ pdfPreviewScale })
                }
                step={0.05}
                style={styles.slider}
                thumbTintColor="#285C46"
                value={settings.pdfPreviewScale}
              />
              <Text style={styles.sliderEdge}>100%</Text>
            </View>
          </ToolSection>
          <ToolSection title={t('developer.ocr')}>
            <ToolButton
              label={t('developer.rerunOcr')}
              onPress={() =>
                void run(
                  async () =>
                    `${await rerunOcr()}개 Score를 대기열에 추가했습니다.`,
                )
              }
            />
            <ToolButton
              label={t('developer.viewOcrResult')}
              onPress={() =>
                void run(
                  async () =>
                    (await getOcrPreview()).join('\n') ||
                    t('developer.loadingError'),
                )
              }
            />
          </ToolSection>
          <ToolSection title={t('developer.database')}>
            <ToolButton
              label={t('developer.stats')}
              onPress={() =>
                void run(async () =>
                  JSON.stringify(await getDatabaseStats(), null, 2),
                )
              }
            />
            <ToolButton
              destructive
              label={t('developer.resetDatabase')}
              onPress={() =>
                confirmReset(
                  () =>
                    void run(async () => {
                      await resetLibraryDatabase();
                      return '라이브러리 DB를 초기화했습니다.';
                    }),
                )
              }
            />
          </ToolSection>
          <ToolSection title={t('developer.storage')}>
            <ToolButton
              label={t('developer.packageUsage')}
              onPress={() =>
                void run(async () => {
                  const value = await getStorageStats();
                  return `${value.packages.join('\n') || 'Package 없음'}\n${formatBytes(value.bytes)}`;
                })
              }
            />
          </ToolSection>
          <ToolSection title={t('developer.sync')}>
            <Text style={styles.detail}>{t('developer.syncStatus')}</Text>
          </ToolSection>
          <ToolSection title={t('developer.debug')}>
            <ToolButton
              label={t('developer.createTestSong')}
              onPress={() =>
                void run(async () => {
                  await createTestSong();
                  return '테스트 Song을 생성했습니다.';
                })
              }
            />
            <ToolButton
              label={t('developer.createTestSetlist')}
              onPress={() =>
                void run(async () => {
                  await createTestSetlist();
                  return '테스트 Setlist를 생성했습니다.';
                })
              }
            />
          </ToolSection>
          {result ? (
            <Text selectable style={styles.result}>
              {result}
            </Text>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function ToolSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function ToolButton({
  destructive = false,
  label,
  onPress,
}: {
  destructive?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={[styles.buttonLabel, destructive && styles.destructive]}>
        {label}
      </Text>
    </Pressable>
  );
}
function confirmReset(onConfirm: () => void) {
  Alert.alert(
    t('developer.resetConfirmTitle'),
    t('developer.resetConfirmBody'),
    [
      { style: 'cancel', text: t('common.cancel') },
      { style: 'destructive', text: t('common.confirm'), onPress: onConfirm },
    ],
  );
}
function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 720,
    padding: 24,
    width: '100%',
  },
  toggleRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 18,
  },
  flex: { flex: 1 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  detail: { color: colors.muted, fontSize: 13, marginTop: 4 },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    margin: 7,
  },
  settingTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  sliderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  slider: { flex: 1, height: 36 },
  sliderEdge: { color: colors.muted, fontSize: 11, width: 38 },
  button: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  buttonLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  destructive: { color: '#A5392D' },
  result: {
    backgroundColor: '#20251F',
    borderRadius: 12,
    color: '#DAE9DE',
    fontFamily: 'Menlo',
    fontSize: 12,
    lineHeight: 18,
    padding: 16,
  },
});
