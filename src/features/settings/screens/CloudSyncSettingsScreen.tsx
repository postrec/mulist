import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { useAppSettings } from '../context/AppSettingsContext';

export function CloudSyncSettingsScreen() {
  const { settings, update } = useAppSettings();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SwitchRow
        description="로그인 후 Song Package를 Firebase에 자동 백업합니다."
        label="Cloud Sync"
        onChange={(cloudSyncEnabled) => void update({ cloudSyncEnabled })}
        value={settings.cloudSyncEnabled}
      />
      <SwitchRow
        description="대용량 PDF 업로드는 Wi-Fi 연결에서만 실행합니다."
        label="Wi-Fi에서만 동기화"
        onChange={(wifiOnlySync) => void update({ wifiOnlySync })}
        value={settings.wifiOnlySync}
      />
      <Text style={styles.note}>
        설정은 저장됩니다. 실제 업로드는 Sync Worker 구현 후 활성화됩니다.
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
