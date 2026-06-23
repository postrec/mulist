import {
  deleteUser,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
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

import { firebaseAuth } from '../../../config/firebase';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { colors } from '../../../shared/theme/colors';
import { reportError } from '../../../shared/logging/reportError';
import { ProfileEditor } from '../../auth/components/ProfileEditor';
import {
  signInWithApple,
  signInWithGoogle,
} from '../../auth/services/socialAuth';
import {
  registerWithEmail,
  signInWithEmail,
} from '../../auth/services/passwordAuth';

export function AccountSettingsScreen() {
  useAppLanguage();
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  const logout = async () => {
    setError(null);
    try {
      await signOut(firebaseAuth);
    } catch (reason: unknown) {
      reportError('로그아웃 실패', reason);
      setError(toMessage(reason));
    }
  };

  const login = async (provider: 'apple' | 'google') => {
    setError(null);
    setIsWorking(true);
    try {
      await (provider === 'apple' ? signInWithApple() : signInWithGoogle());
    } catch (reason: unknown) {
      reportError(`${provider} 로그인 실패`, reason);
      setError(toMessage(reason));
    } finally {
      setIsWorking(false);
    }
  };

  const submitEmail = async (mode: 'login' | 'register') => {
    setError(null);
    setIsWorking(true);
    try {
      await (mode === 'register'
        ? registerWithEmail(email, password)
        : signInWithEmail(email, password));
      setPassword('');
    } catch (reason: unknown) {
      reportError(
        `이메일 ${mode === 'register' ? '회원가입' : '로그인'} 실패`,
        reason,
      );
      setError(toMessage(reason));
    } finally {
      setIsWorking(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      t('account.deleteConfirmTitle'),
      t('account.deleteConfirmBody'),
      [
        { style: 'cancel', text: t('common.cancel') },
        {
          style: 'destructive',
          text: t('common.delete'),
          onPress: () => void removeAccount(),
        },
      ],
    );

  const removeAccount = async () => {
    if (!user) return;
    setError(null);
    try {
      await deleteUser(user);
    } catch (reason: unknown) {
      reportError('계정 삭제 실패', reason);
      setError(toMessage(reason));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.heading}>
          {user
            ? user.displayName || user.email || t('account.title')
            : t('account.notSignedIn')}
        </Text>
        <InfoRow
          label={t('account.email')}
          value={user?.email ?? t('common.none')}
        />
        <InfoRow
          label={t('account.firebaseUid')}
          value={user?.uid ?? t('common.none')}
        />
        <InfoRow
          label={t('account.loginMethod')}
          value={
            user?.providerData
              .map((provider) => provider.providerId)
              .join(', ') || '-'
          }
        />
      </View>
      {user ? (
        <ProfileEditor
          fallbackName={user.displayName || user.email?.split('@')[0] || ''}
          uid={user.uid}
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!user ? (
        <>
          <View style={styles.emailCard}>
            <Text style={styles.sectionTitle}>
              {t('account.signInWithEmail')}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!isWorking}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder={t('account.emailPlaceholder')}
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              editable={!isWorking}
              onChangeText={setPassword}
              onSubmitEditing={() => void submitEmail('login')}
              placeholder={t('account.passwordPlaceholder')}
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <View style={styles.emailActions}>
              <ActionButton
                disabled={isWorking}
                grow
                label={isWorking ? t('common.loading') : t('account.login')}
                onPress={() => void submitEmail('login')}
              />
              <ActionButton
                disabled={isWorking}
                grow
                label={t('account.register')}
                onPress={() => void submitEmail('register')}
              />
            </View>
          </View>
          <ActionButton
            disabled={isWorking}
            label={t('account.googleLogin')}
            onPress={() => void login('google')}
          />
          <ActionButton
            disabled={isWorking}
            label={t('account.appleLogin')}
            onPress={() => void login('apple')}
          />
        </>
      ) : null}
      <ActionButton
        disabled={!user}
        label={t('account.logout')}
        onPress={() => void logout()}
      />
      <ActionButton
        destructive
        disabled={!user}
        label={t('account.deleteAccount')}
        onPress={confirmDelete}
      />
      {!user ? (
        <Text style={styles.note}>{t('account.cloudNotice')}</Text>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  destructive = false,
  disabled = false,
  grow = false,
  label,
  onPress,
}: {
  destructive?: boolean;
  disabled?: boolean;
  grow?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, grow && styles.grow, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonLabel, destructive && styles.destructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function toMessage(reason: unknown): string {
  const code =
    typeof reason === 'object' && reason && 'code' in reason
      ? String(reason.code)
      : '';
  const messages: Record<string, string> = {
    'auth/configuration-not-found':
      'Firebase Console에서 이메일/비밀번호 로그인을 먼저 활성화해 주세요.',
    'auth/email-already-in-use': '이미 가입된 이메일입니다. 로그인해 주세요.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/invalid-email': '올바른 이메일 주소를 입력해 주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
    'auth/too-many-requests':
      '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    'auth/weak-password': '더 안전한 비밀번호를 입력해 주세요.',
  };
  if (messages[code]) return messages[code];
  if (
    reason instanceof Error &&
    reason.message.includes('requires-recent-login')
  ) {
    return '보안을 위해 다시 로그인한 뒤 계정 삭제를 시도해 주세요.';
  }
  return reason instanceof Error ? reason.message : '계정 작업에 실패했습니다.';
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 620,
    padding: 24,
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  emailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  emailActions: { flexDirection: 'row', gap: 10 },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  infoRow: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: 11,
  },
  label: { color: colors.muted, width: 110 },
  value: { color: colors.text, flex: 1, textAlign: 'right' },
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
  },
  grow: { flex: 1 },
  buttonLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  destructive: { color: '#A5392D' },
  disabled: { opacity: 0.4 },
  error: { color: '#A5392D', fontSize: 13 },
  note: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
