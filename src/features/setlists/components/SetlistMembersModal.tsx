import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { reportError } from '../../../shared/logging/reportError';
import { colors } from '../../../shared/theme/colors';
import {
  inviteSetlistUser,
  listSetlistMembers,
  type SetlistMember,
} from '../services/setlistMembersService';

export function SetlistMembersModal({
  onClose,
  setlistId,
  visible,
}: {
  onClose: () => void;
  setlistId: string;
  visible: boolean;
}) {
  const [members, setMembers] = useState<readonly SetlistMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!visible) return;
    void listSetlistMembers(setlistId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [setlistId, visible]);

  const invite = async () => {
    if (!email.trim()) return;
    setWorking(true);
    setMessage(null);
    try {
      const member = await inviteSetlistUser(setlistId, email.trim(), role);
      setMembers((current) => [
        ...current.filter((item) => item.uid !== member.uid),
        member,
      ]);
      setEmail('');
      setMessage('사용자를 셋리스트에 추가했습니다.');
    } catch (reason: unknown) {
      reportError('셋리스트 사용자 초대 실패', reason);
      setMessage(
        reason instanceof Error
          ? reason.message
          : '사용자를 추가하지 못했습니다.',
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={styles.card}
        >
          <Text style={styles.title}>셋리스트 사용자</Text>
          {members.map((member) => (
            <View key={member.uid} style={styles.member}>
              <View style={styles.memberText}>
                <Text style={styles.name}>
                  {member.displayName || member.email || member.uid}
                </Text>
                {member.displayName && member.email ? (
                  <Text style={styles.email}>{member.email}</Text>
                ) : null}
              </View>
              <Text style={styles.role}>{roleLabel(member.role)}</Text>
            </View>
          ))}
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="MuList 사용자 이메일"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <View style={styles.roleRow}>
            <RoleButton
              label="보기"
              onPress={() => setRole('viewer')}
              selected={role === 'viewer'}
            />
            <RoleButton
              label="편집"
              onPress={() => setRole('editor')}
              selected={role === 'editor'}
            />
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.secondary}>
              <Text style={styles.secondaryText}>닫기</Text>
            </Pressable>
            <Pressable
              disabled={working || !email.trim()}
              onPress={() => void invite()}
              style={[
                styles.primary,
                (working || !email.trim()) && styles.disabled,
              ]}
            >
              <Text style={styles.primaryText}>
                {working ? '추가 중…' : '사용자 추가'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RoleButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roleButton, selected && styles.selectedRole]}
    >
      <Text
        style={[styles.roleButtonText, selected && styles.selectedRoleText]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
function roleLabel(role: SetlistMember['role']) {
  return role === 'owner' ? '소유자' : role === 'editor' ? '편집' : '보기';
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    gap: 10,
    maxWidth: 460,
    padding: 22,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  member: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  memberText: { flex: 1 },
  name: { color: colors.text, fontWeight: '700' },
  email: { color: colors.muted, fontSize: 11, marginTop: 2 },
  role: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  input: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    padding: 12,
  },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleButton: {
    borderColor: colors.border,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectedRole: { backgroundColor: colors.primary },
  roleButtonText: { color: colors.text },
  selectedRoleText: { color: '#fff', fontWeight: '700' },
  message: { color: colors.muted, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  secondary: { padding: 12 },
  secondaryText: { color: colors.text, fontWeight: '700' },
  primary: { backgroundColor: colors.primary, borderRadius: 9, padding: 12 },
  primaryText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.4 },
});
