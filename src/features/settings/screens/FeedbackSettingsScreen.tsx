import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { getAppDiagnostics } from '../services/appDiagnostics';

type FeedbackType = '버그 제보' | '기능 제안' | '문의하기';

export function FeedbackSettingsScreen() {
  const diagnostics = getAppDiagnostics();
  const send = async (type: FeedbackType) => {
    const body = [
      '내용을 입력해 주세요.',
      '',
      '--- 진단 정보 ---',
      `App: ${diagnostics.appVersion}`,
      `Build: ${diagnostics.buildNumber}`,
      `Device: ${diagnostics.deviceModel}`,
      `OS: ${diagnostics.osVersion}`,
    ].join('\n');
    await Linking.openURL(
      `mailto:?subject=${encodeURIComponent(`[MuList] ${type}`)}&body=${encodeURIComponent(body)}`,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        메일 앱을 열어 의견을 보냅니다. 문제 해결을 위해 앱과 기기 정보가 자동
        포함됩니다.
      </Text>
      <FeedbackButton
        description="오류 상황과 재현 방법을 알려주세요."
        label="버그 제보"
        onPress={() => void send('버그 제보')}
      />
      <FeedbackButton
        description="연주 흐름을 개선할 아이디어를 알려주세요."
        label="기능 제안"
        onPress={() => void send('기능 제안')}
      />
      <FeedbackButton
        description="MuList 사용에 관해 문의하세요."
        label="문의하기"
        onPress={() => void send('문의하기')}
      />
      <View style={styles.diagnostics}>
        <Text style={styles.diagnosticTitle}>포함되는 진단 정보</Text>
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
