import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { firebaseAuth, firestore } from '../../../config/firebase';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { reportError } from '../../../shared/logging/reportError';
import { redeemSubscriptionCode } from '../../subscription/services/redeemService';

type Plan = 'free' | 'premium';

export function SubscriptionSettingsScreen() {
  useAppLanguage();
  const [plan, setPlan] = useState<Plan>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => {
        if (!user) {
          setPlan('free');
          setIsLoading(false);
          return;
        }
        void getDoc(doc(firestore, 'entitlements', user.uid))
          .then((snapshot) => {
            const data = snapshot.data();
            const expiresAt = data?.expiresAt as Timestamp | null | undefined;
            const active = !expiresAt || expiresAt.toMillis() > Date.now();
            setPlan(data?.plan === 'premium' && active ? 'premium' : 'free');
          })
          .catch(() => setPlan('free'))
          .finally(() => setIsLoading(false));
      }),
    [],
  );

  const notConfigured = () =>
    Alert.alert(
      t('subscription.unavailable'),
      'StoreKit 또는 RevenueCat 상품 설정과 서버 영수증 검증을 먼저 완료해야 합니다.',
    );

  const redeem = async () => {
    if (!code.trim()) return;
    setIsRedeeming(true);
    setRedeemMessage(null);
    try {
      await redeemSubscriptionCode(code);
      setPlan('premium');
      setCode('');
      setRedeemMessage(t('subscription.redeemSuccess'));
    } catch (reason: unknown) {
      reportError('리딤 코드 적용 실패', reason);
      setRedeemMessage(redeemErrorMessage(reason));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.planCard}>
        <Text style={styles.caption}>{t('subscription.currentPlan')}</Text>
        <Text style={styles.plan}>
          {isLoading
            ? t('common.loading')
            : plan === 'premium'
              ? t('subscription.premiumPlan')
              : t('subscription.freePlan')}
        </Text>
        <Text style={styles.description}>
          {plan === 'premium'
            ? '무제한 곡, 클라우드 백업, 동기화와 공유를 사용할 수 있습니다.'
            : '최대 30곡을 로컬에 저장할 수 있습니다.'}
        </Text>
      </View>
      <View style={styles.redeemCard}>
        <Text style={styles.redeemTitle}>{t('subscription.redeemTitle')}</Text>
        <Text style={styles.redeemDescription}>
          {t('subscription.redeemDescription')}
        </Text>
        <View style={styles.redeemRow}>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isRedeeming}
            onChangeText={setCode}
            onSubmitEditing={() => void redeem()}
            placeholder={t('subscription.redeemPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.codeInput}
            value={code}
          />
          <Pressable
            disabled={!code.trim() || isRedeeming}
            onPress={() => void redeem()}
            style={[
              styles.redeemButton,
              (!code.trim() || isRedeeming) && styles.disabled,
            ]}
          >
            <Text style={styles.redeemButtonText}>
              {isRedeeming ? t('common.loading') : t('subscription.redeem')}
            </Text>
          </Pressable>
        </View>
        {redeemMessage ? (
          <Text style={styles.redeemMessage}>{redeemMessage}</Text>
        ) : null}
      </View>
      <SubscriptionButton
        label={t('subscription.startSubscription')}
        onPress={notConfigured}
      />
      <SubscriptionButton
        label={t('subscription.restorePurchases')}
        onPress={notConfigured}
      />
      <SubscriptionButton
        label={t('subscription.manageBilling')}
        onPress={notConfigured}
      />
      <Text style={styles.note}>{t('subscription.unavailable')}</Text>
    </ScrollView>
  );
}

function redeemErrorMessage(reason: unknown): string {
  const code =
    typeof reason === 'object' && reason && 'code' in reason
      ? String(reason.code)
      : '';
  if (code.includes('unauthenticated'))
    return t('subscription.redeemSignInRequired');
  if (code.includes('resource-exhausted'))
    return t('subscription.redeemRateLimited');
  if (
    code.includes('not-found') ||
    code.includes('invalid-argument') ||
    code.includes('failed-precondition')
  )
    return t('subscription.redeemInvalid');
  return reason instanceof Error
    ? reason.message
    : t('subscription.redeemInvalid');
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
  redeemCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  redeemTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  redeemDescription: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  redeemRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  codeInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  redeemButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: 14,
  },
  redeemButtonText: { color: colors.surface, fontSize: 14, fontWeight: '800' },
  redeemMessage: { color: colors.primary, fontSize: 12, lineHeight: 18 },
  disabled: { opacity: 0.4 },
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
