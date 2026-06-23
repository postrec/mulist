import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { useAppSettings } from '../context/AppSettingsContext';
import { runCloudSync } from '../../cloud/services/syncWorker';

export function CloudSyncSettingsScreen() {
  useAppLanguage();
  const { settings, update } = useAppSettings();
  return (
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
      <Text style={styles.note}>
        로그인 상태에서 앱 시작·복귀·네트워크 재연결 시 자동으로 동기화됩니다.
      </Text>
    </ScrollView>
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
});
