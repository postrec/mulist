import { useEffect, useRef, useState } from 'react';
import {
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
import { useAppSettings } from '../context/AppSettingsContext';
import { runCloudSync, syncAllSongsNow } from '../../cloud/services/syncWorker';
import { reportError } from '../../../shared/logging/reportError';

export function CloudSyncSettingsScreen() {
  useAppLanguage();
  const { settings, update } = useAppSettings();
  const [logs, setLogs] = useState<readonly string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const syncAll = async () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setLogs([]);
    setSyncing(true);
    try {
      const result = await syncAllSongsNow((message) =>
        setLogs((current) => [...current.slice(-7), message]),
      );
      if (result.failed === 0) {
        hideTimer.current = setTimeout(() => setLogs([]), 60_000);
      }
    } catch (reason: unknown) {
      reportError('전체 곡 수동 동기화 실패', reason);
      setLogs((current) => [
        ...current,
        reason instanceof Error
          ? reason.message
          : '전체 동기화에 실패했습니다.',
      ]);
    } finally {
      setSyncing(false);
    }
  };
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SwitchRow
          description={t('settings.syncSubtitle')}
          label={t('settings.cloudSync')}
          onChange={(cloudSyncEnabled) => {
            void update({ cloudSyncEnabled }).then(() => {
              if (cloudSyncEnabled) void runCloudSync();
            });
          }}
          value={settings.cloudSyncEnabled}
        />
        <SwitchRow
          description="대용량 PDF 업로드는 Wi-Fi 연결에서만 실행합니다."
          label="Wi-Fi에서만 동기화"
          onChange={(wifiOnlySync) => void update({ wifiOnlySync })}
          value={settings.wifiOnlySync}
        />
        <Pressable
          disabled={syncing}
          onPress={() => void syncAll()}
          style={[styles.syncButton, syncing && styles.disabled]}
        >
          <Text style={styles.syncButtonLabel}>
            {syncing ? '모든 곡 동기화 중…' : '지금 모든 곡 데이터 동기화'}
          </Text>
        </Pressable>
        <Text style={styles.note}>
          로그인 상태에서 앱 시작·복귀·네트워크 재연결 시 자동으로 동기화됩니다.
        </Text>
      </ScrollView>
      {logs.length > 0 ? (
        <View style={styles.logPanel}>
          <Text style={styles.logTitle}>동기화 로그</Text>
          {logs.map((log, index) => (
            <Text
              key={`${index}-${log}`}
              numberOfLines={1}
              style={styles.logLine}
            >
              {log}
            </Text>
          ))}
        </View>
      ) : null}
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
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch onValueChange={onChange} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 620,
    padding: 24,
    width: '100%',
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 18,
  },
  text: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  syncButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 15,
  },
  syncButtonLabel: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  logPanel: {
    backgroundColor: 'rgba(21,26,22,0.94)',
    borderRadius: 10,
    bottom: 16,
    maxWidth: 360,
    padding: 12,
    position: 'absolute',
    right: 16,
    width: '44%',
  },
  logTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  logLine: { color: '#D9E2DC', fontSize: 10, lineHeight: 15 },
});
