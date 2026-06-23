import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportError } from '../../../shared/logging/reportError';
import { SCREEN_HEADER_HEIGHT } from '../../../shared/layout/metrics';
import { colors } from '../../../shared/theme/colors';
import {
  acceptFriendRequest,
  listFriendRequests,
  listFriends,
  sendFriendRequest,
  type SocialUser,
} from '../services/socialService';

export function SocialScreen({ onBack }: { onBack: () => void }) {
  const [friends, setFriends] = useState<readonly SocialUser[]>([]);
  const [requests, setRequests] = useState<readonly SocialUser[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextFriends, nextRequests] = await Promise.all([
        listFriends(),
        listFriendRequests(),
      ]);
      setFriends(nextFriends);
      setRequests(nextRequests);
    } catch (reason: unknown) {
      reportError('친구 정보 불러오기 실패', reason);
      setMessage(
        reason instanceof Error
          ? reason.message
          : '친구 정보를 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const requestFriend = async () => {
    if (!email.trim()) return;
    setWorking(true);
    setMessage(null);
    try {
      const user = await sendFriendRequest(email.trim());
      setEmail('');
      setMessage(
        `${user.displayName || user.email}님에게 친구 요청을 보냈습니다.`,
      );
    } catch (reason: unknown) {
      reportError('친구 요청 실패', reason);
      setMessage(
        reason instanceof Error
          ? reason.message
          : '친구 요청을 보내지 못했습니다.',
      );
    } finally {
      setWorking(false);
    }
  };

  const accept = async (user: SocialUser) => {
    setWorking(true);
    setMessage(null);
    try {
      await acceptFriendRequest(user.uid);
      await load();
    } catch (reason: unknown) {
      reportError('친구 요청 수락 실패', reason);
      setMessage(
        reason instanceof Error
          ? reason.message
          : '친구 요청을 수락하지 못했습니다.',
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹ 라이브러리</Text>
        </Pressable>
        <Text style={styles.headerTitle}>친구</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>친구 추가</Text>
        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={() => void requestFriend()}
            placeholder="MuList 이메일 정확히 입력"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <Pressable
            disabled={working || !email.trim()}
            onPress={() => void requestFriend()}
            style={[
              styles.primary,
              (working || !email.trim()) && styles.disabled,
            ]}
          >
            <Text style={styles.primaryText}>요청</Text>
          </Pressable>
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Text style={styles.sectionTitle}>받은 요청</Text>
        {requests.length ? (
          requests.map((user) => (
            <UserRow
              action="수락"
              key={user.uid}
              onPress={() => void accept(user)}
              user={user}
            />
          ))
        ) : (
          <Text style={styles.empty}>받은 친구 요청이 없습니다.</Text>
        )}
        <Text style={styles.sectionTitle}>친구 {friends.length}</Text>
        {friends.length ? (
          friends.map((user) => <UserRow key={user.uid} user={user} />)
        ) : (
          <Text style={styles.empty}>아직 친구가 없습니다.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserRow({
  action,
  onPress,
  user,
}: {
  action?: string;
  onPress?: () => void;
  user: SocialUser;
}) {
  const initial = (user.displayName || user.email || 'M')
    .charAt(0)
    .toUpperCase();
  return (
    <View style={styles.userRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.userText}>
        <Text style={styles.name}>{user.displayName || user.email}</Text>
        {user.displayName && user.email ? (
          <Text style={styles.email}>{user.email}</Text>
        ) : null}
      </View>
      {action && onPress ? (
        <Pressable onPress={onPress} style={styles.action}>
          <Text style={styles.actionText}>{action}</Text>
        </Pressable>
      ) : null}
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
    height: SCREEN_HEADER_HEIGHT,
    paddingHorizontal: 20,
  },
  back: { color: colors.primary, fontSize: 14, fontWeight: '700', width: 120 },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  spacer: { width: 120 },
  content: { alignSelf: 'center', maxWidth: 620, padding: 24, width: '100%' },
  sectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 18,
  },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    padding: 12,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.4 },
  message: { color: colors.muted, fontSize: 12, marginTop: 8 },
  userRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarText: { color: '#fff', fontWeight: '800' },
  userText: { flex: 1, marginLeft: 11 },
  name: { color: colors.text, fontWeight: '700' },
  email: { color: colors.muted, fontSize: 11, marginTop: 2 },
  action: { padding: 8 },
  actionText: { color: colors.primary, fontWeight: '800' },
  empty: { color: colors.muted, paddingVertical: 12 },
});
