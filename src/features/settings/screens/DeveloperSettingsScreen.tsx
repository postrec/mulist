import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../shared/theme/colors';
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
  const { settings, update } = useAppSettings();
  const [result, setResult] = useState('');
  const run = async (operation: () => Promise<string>) => {
    try {
      setResult(await operation());
    } catch (error: unknown) {
      setResult(
        error instanceof Error ? error.message : '작업에 실패했습니다.',
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.toggleRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>Developer Mode</Text>
          <Text style={styles.detail}>진단 및 테스트 도구를 표시합니다.</Text>
        </View>
        <Switch
          onValueChange={(developerMode) => void update({ developerMode })}
          value={settings.developerMode}
        />
      </View>
      {settings.developerMode ? (
        <>
          <ToolSection title="OCR">
            <ToolButton
              label="OCR 강제 재실행"
              onPress={() =>
                void run(
                  async () =>
                    `${await rerunOcr()}개 Score를 대기열에 추가했습니다.`,
                )
              }
            />
            <ToolButton
              label="OCR 결과 보기"
              onPress={() =>
                void run(
                  async () =>
                    (await getOcrPreview()).join('\n') ||
                    'OCR 결과가 없습니다.',
                )
              }
            />
          </ToolSection>
          <ToolSection title="Database">
            <ToolButton
              label="Song Count / Database 정보"
              onPress={() =>
                void run(async () =>
                  JSON.stringify(await getDatabaseStats(), null, 2),
                )
              }
            />
            <ToolButton
              destructive
              label="Database 초기화"
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
          <ToolSection title="Storage">
            <ToolButton
              label="Song Package / 사용량 보기"
              onPress={() =>
                void run(async () => {
                  const value = await getStorageStats();
                  return `${value.packages.join('\n') || 'Package 없음'}\n${formatBytes(value.bytes)}`;
                })
              }
            />
          </ToolSection>
          <ToolSection title="Sync">
            <Text style={styles.detail}>Sync 상태: Sync Queue 미구성</Text>
          </ToolSection>
          <ToolSection title="Debug">
            <ToolButton
              label="테스트 Song 생성"
              onPress={() =>
                void run(async () => {
                  await createTestSong();
                  return '테스트 Song을 생성했습니다.';
                })
              }
            />
            <ToolButton
              label="테스트 Setlist 생성"
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
  Alert.alert('Database 초기화', '모든 Song과 Setlist를 삭제합니다.', [
    { style: 'cancel', text: '취소' },
    { style: 'destructive', text: '초기화', onPress: onConfirm },
  ]);
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
