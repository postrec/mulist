import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { firebaseAuth, firestore } from '../../../config/firebase';
import { colors } from '../../../shared/theme/colors';

type Plan = 'free' | 'premium';

export function SubscriptionSettingsScreen() {
  const [plan, setPlan] = useState<Plan>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => {
        if (!user) {
          setPlan('free');
          setIsLoading(false);
          return;
        }
        void getDoc(doc(firestore, 'entitlements', user.uid))
          .then((snapshot) =>
            setPlan(snapshot.data()?.plan === 'premium' ? 'premium' : 'free'),
          )
          .catch(() => setPlan('free'))
          .finally(() => setIsLoading(false));
      }),
    [],
  );

  const notConfigured = () =>
    Alert.alert(
      '구독 설정 필요',
      'StoreKit 또는 RevenueCat 상품 설정과 서버 영수증 검증을 먼저 완료해야 합니다.',
    );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.planCard}>
        <Text style={styles.caption}>현재 플랜</Text>
        <Text style={styles.plan}>
          {isLoading ? '확인 중…' : plan === 'premium' ? 'Premium' : 'Free'}
        </Text>
        <Text style={styles.description}>
          {plan === 'premium'
            ? '무제한 곡, 클라우드 백업, 동기화와 공유를 사용할 수 있습니다.'
            : '최대 30곡을 로컬에 저장할 수 있습니다.'}
        </Text>
      </View>
      <SubscriptionButton label="Premium 시작" onPress={notConfigured} />
      <SubscriptionButton label="구매 복원" onPress={notConfigured} />
      <SubscriptionButton label="결제 관리" onPress={notConfigured} />
      <Text style={styles.note}>
        결제 버튼은 StoreKit/RevenueCat 구성이 완료될 때 활성화됩니다.
      </Text>
    </ScrollView>
  );
}

function SubscriptionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
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
  planCard: { backgroundColor: colors.primary, borderRadius: 18, padding: 24 },
  caption: { color: colors.primarySoft, fontSize: 13, fontWeight: '700' },
  plan: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
  },
  description: {
    color: colors.surface,
    lineHeight: 21,
    marginTop: 10,
    opacity: 0.9,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
  },
  buttonLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
