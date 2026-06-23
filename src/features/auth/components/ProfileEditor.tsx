import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';
import {
  defaultUserProfile,
  musicianParts,
  profileColors,
  type UserProfile,
} from '../domain/UserProfile';
import {
  loadCloudProfile,
  loadLocalProfile,
  saveUserProfile,
} from '../services/userProfileService';

interface ProfileEditorProps {
  fallbackName: string;
  uid: string;
}

export function ProfileEditor({ fallbackName, uid }: ProfileEditorProps) {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadLocalProfile(uid).then((local) => {
      if (active)
        setProfile({ ...local, name: local.name || fallbackName || '' });
    });
    void loadCloudProfile(uid)
      .then((cloud) => {
        if (active && cloud)
          setProfile({ ...cloud, name: cloud.name || fallbackName || '' });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [fallbackName, uid]);

  const update = (changes: Partial<UserProfile>) =>
    setProfile((current) => ({ ...current, ...changes }));

  const save = async () => {
    setIsSaving(true);
    setNotice(null);
    const synced = await saveUserProfile(uid, profile);
    setNotice(
      synced
        ? '프로필을 저장했습니다.'
        : '기기에 저장했습니다. Cloud 연결 시 다시 동기화해 주세요.',
    );
    setIsSaving(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>프로필</Text>
      <Text style={styles.label}>프로필 색상</Text>
      <View style={styles.colors}>
        {profileColors.map((color, index) => (
          <Pressable
            accessibilityLabel={`프로필 색상 ${index + 1}`}
            accessibilityRole="button"
            key={color}
            onPress={() => update({ color })}
            style={[
              styles.color,
              { backgroundColor: color },
              profile.color === color && styles.selectedColor,
            ]}
          >
            {profile.color === color ? (
              <Text style={styles.check}>✓</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>이름</Text>
      <TextInput
        maxLength={30}
        onChangeText={(name) => update({ name })}
        placeholder="표시할 이름"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={profile.name}
      />
      <Text style={styles.label}>자기소개</Text>
      <TextInput
        maxLength={160}
        multiline
        onChangeText={(bio) => update({ bio })}
        placeholder="연주 활동이나 관심사를 간단히 소개해 주세요."
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.bio]}
        textAlignVertical="top"
        value={profile.bio}
      />
      <Text style={styles.counter}>{profile.bio.length}/160</Text>
      <Text style={styles.label}>주 파트</Text>
      <View style={styles.parts}>
        {musicianParts.map((part) => (
          <Pressable
            key={part}
            onPress={() => update({ primaryPart: part })}
            style={[
              styles.part,
              profile.primaryPart === part && styles.selectedPart,
            ]}
          >
            <Text
              style={[
                styles.partText,
                profile.primaryPart === part && styles.selectedPartText,
              ]}
            >
              {part}
            </Text>
          </Pressable>
        ))}
      </View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Pressable
        disabled={isSaving}
        onPress={() => void save()}
        style={[styles.save, isSaving && styles.disabled]}
      >
        <Text style={styles.saveText}>
          {isSaving ? '저장 중…' : '프로필 저장'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
  },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 5 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  color: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  selectedColor: { borderColor: colors.text, borderWidth: 3 },
  check: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  bio: { minHeight: 88 },
  counter: { color: colors.muted, fontSize: 11, textAlign: 'right' },
  parts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  part: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedPart: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  partText: { color: colors.text, fontSize: 13 },
  selectedPartText: { color: '#FFFFFF', fontWeight: '700' },
  notice: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  save: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 11,
    marginTop: 5,
    padding: 14,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.5 },
});
