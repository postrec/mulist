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
  View,
} from 'react-native';

import { firebaseAuth } from '../../../config/firebase';
import { colors } from '../../../shared/theme/colors';

export function AccountSettingsScreen() {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  const logout = async () => {
    setError(null);
    try {
      await signOut(firebaseAuth);
    } catch (reason: unknown) {
      setError(toMessage(reason));
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      '계정 삭제',
      'Firebase 계정을 영구 삭제합니다. 최근 로그인이 필요할 수 있습니다.',
      [
        { style: 'cancel', text: '취소' },
        {
          style: 'destructive',
          text: '삭제',
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
      setError(toMessage(reason));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.heading}>
          {user?.displayName ?? '로그인하지 않음'}
        </Text>
        <InfoRow label="이메일" value={user?.email ?? '-'} />
        <InfoRow label="Firebase UID" value={user?.uid ?? '-'} />
        <InfoRow
          label="로그인 방식"
          value={
            user?.providerData
              .map((provider) => provider.providerId)
              .join(', ') || '-'
          }
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton
        disabled={!user}
        label="로그아웃"
        onPress={() => void logout()}
      />
      <ActionButton
        destructive
        disabled={!user}
        label="계정 삭제"
        onPress={confirmDelete}
      />
      {!user ? (
        <Text style={styles.note}>
          Google 또는 Apple 로그인은 Authentication 작업 완료 후 사용할 수
          있습니다.
        </Text>
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
  label,
  onPress,
}: {
  destructive?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonLabel, destructive && styles.destructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function toMessage(reason: unknown): string {
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
