import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { getAppDiagnostics } from '../services/appDiagnostics';

const licenses = [
  'Expo — MIT',
  'React — MIT',
  'React Native — MIT',
  'Firebase JavaScript SDK — Apache-2.0',
  'React Native WebView — MIT',
  'Mozilla PDF.js — Apache-2.0',
];

export function VersionSettingsScreen() {
  const diagnostics = getAppDiagnostics();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.appName}>MuList</Text>
        <Text style={styles.version}>Version {diagnostics.appVersion}</Text>
        <Text style={styles.build}>Build {diagnostics.buildNumber}</Text>
      </View>
      <InfoSection title="Release Notes">
        <Text style={styles.body}>0.1.0 MVP</Text>
        <Text style={styles.body}>
          Song 중심 PDF 라이브러리, 주석, 검색, 셋리스트, 음악 도구와 Firebase
          기반을 추가했습니다.
        </Text>
      </InfoSection>
      <InfoSection title="Open Source Licenses">
        {licenses.map((license) => (
          <Text key={license} style={styles.body}>
            {license}
          </Text>
        ))}
      </InfoSection>
      <InfoSection title="Legal">
        <Text style={styles.unavailable}>
          Terms of Service와 Privacy Policy는 공개 URL 확정 후 연결됩니다.
        </Text>
      </InfoSection>
    </ScrollView>
  );
}

function InfoSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 14,
    maxWidth: 620,
    padding: 24,
    width: '100%',
  },
  hero: { alignItems: 'center', padding: 28 },
  appName: { color: colors.text, fontSize: 34, fontWeight: '800' },
  version: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  build: { color: colors.muted, fontSize: 12, marginTop: 4 },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 18,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  unavailable: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
