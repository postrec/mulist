import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../shared/theme/colors';
import { SettingsRow } from '../components/SettingsRow';
import type { SettingsRoute } from '../types';
import { AccountSettingsScreen } from './AccountSettingsScreen';
import { CloudSyncSettingsScreen } from './CloudSyncSettingsScreen';
import { DisplaySettingsScreen } from './DisplaySettingsScreen';
import { DeveloperSettingsScreen } from './DeveloperSettingsScreen';
import { FeedbackSettingsScreen } from './FeedbackSettingsScreen';
import { SubscriptionSettingsScreen } from './SubscriptionSettingsScreen';
import { VersionSettingsScreen } from './VersionSettingsScreen';

interface SettingsScreenProps {
  onClose: () => void;
}

const routeLabels: Record<SettingsRoute, string> = {
  account: '계정',
  developer: 'Developer Mode',
  display: '화면 설정',
  feedback: '피드백',
  subscription: '구독',
  sync: '클라우드 동기화',
  version: '버전 정보',
};

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [route, setRoute] = useState<SettingsRoute | null>(null);
  const goBack = () => (route ? setRoute(null) : onClose());

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>
            ‹ {route ? '설정' : '라이브러리'}
          </Text>
        </Pressable>
        <Text style={styles.title}>{route ? routeLabels[route] : '설정'}</Text>
        <View style={styles.spacer} />
      </View>
      {route ? (
        <SettingsRouteContent route={route} />
      ) : (
        <SettingsHome onSelect={setRoute} />
      )}
    </SafeAreaView>
  );
}

function SettingsHome({
  onSelect,
}: {
  onSelect: (route: SettingsRoute) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>앱 설정</Text>
      <View style={styles.group}>
        <SettingsRow
          detail="테마, 글자 크기, PDF 보기"
          label="화면 설정"
          onPress={() => onSelect('display')}
        />
        <SettingsRow
          detail="로그인과 계정 관리"
          label="계정"
          onPress={() => onSelect('account')}
        />
        <SettingsRow
          detail="플랜과 결제 관리"
          label="구독"
          onPress={() => onSelect('subscription')}
        />
        <SettingsRow
          detail="백업과 네트워크 사용"
          label="클라우드 동기화"
          onPress={() => onSelect('sync')}
        />
      </View>
      <Text style={styles.sectionTitle}>지원</Text>
      <View style={styles.group}>
        <SettingsRow
          label="Developer Mode"
          onPress={() => onSelect('developer')}
        />
        <SettingsRow label="피드백" onPress={() => onSelect('feedback')} />
        <SettingsRow label="버전 정보" onPress={() => onSelect('version')} />
      </View>
    </ScrollView>
  );
}

function SettingsRouteContent({ route }: { route: SettingsRoute }) {
  if (route === 'display') return <DisplaySettingsScreen />;
  if (route === 'account') return <AccountSettingsScreen />;
  if (route === 'subscription') return <SubscriptionSettingsScreen />;
  if (route === 'sync') return <CloudSyncSettingsScreen />;
  if (route === 'developer') return <DeveloperSettingsScreen />;
  if (route === 'feedback') return <FeedbackSettingsScreen />;
  if (route === 'version') return <VersionSettingsScreen />;
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{routeLabels[route]}</Text>
      <Text style={styles.placeholderText}>
        이 설정 화면을 구성하고 있습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 20,
  },
  backButton: { paddingVertical: 12, width: 130 },
  backLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  spacer: { width: 130 },
  scrollContent: {
    alignSelf: 'center',
    maxWidth: 720,
    padding: 24,
    width: '100%',
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
    marginTop: 18,
  },
  group: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  placeholderTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  placeholderText: { color: colors.muted, marginTop: 8 },
});
