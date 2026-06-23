import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../../shared/theme/colors';
import { SCREEN_HEADER_HEIGHT } from '../../../shared/layout/metrics';
import { t } from '../../../shared/i18n';
import { useAppLanguage } from '../../../shared/i18n/useAppLanguage';
import { firebaseAuth } from '../../../config/firebase';
import {
  defaultUserProfile,
  type UserProfile,
} from '../../auth/domain/UserProfile';
import {
  loadCloudProfile,
  loadLocalProfile,
} from '../../auth/services/userProfileService';
import { SettingsRow } from '../components/SettingsRow';
import type { SettingsRoute } from '../types';
import { AccountSettingsScreen } from './AccountSettingsScreen';
import { AllLogsScreen } from './AllLogsScreen';
import { CloudSyncSettingsScreen } from './CloudSyncSettingsScreen';
import { DisplaySettingsScreen } from './DisplaySettingsScreen';
import { DeveloperSettingsScreen } from './DeveloperSettingsScreen';
import { FeedbackSettingsScreen } from './FeedbackSettingsScreen';
import { LanguageSettingsScreen } from './LanguageSettingsScreen';
import { SubscriptionSettingsScreen } from './SubscriptionSettingsScreen';
import { VersionSettingsScreen } from './VersionSettingsScreen';

interface SettingsScreenProps {
  onClose: () => void;
}

function getRouteLabel(route: SettingsRoute): string {
  if (route === 'account') return t('settings.account');
  if (route === 'developer') return t('settings.developerMode');
  if (route === 'display') return t('settings.displaySettings');
  if (route === 'feedback') return t('settings.feedback');
  if (route === 'language') return t('settings.language');
  if (route === 'logs') return '모든 로그';
  if (route === 'subscription') return t('settings.subscription');
  if (route === 'sync') return t('settings.cloudSync');
  return t('settings.versionInfo');
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  useAppLanguage();
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
            {route ? t('common.backToSettings') : t('common.backToLibrary')}
          </Text>
        </Pressable>
        <Text style={styles.title}>
          {route ? getRouteLabel(route) : t('settings.title')}
        </Text>
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
      <AccountSummary onPress={() => onSelect('account')} />
      <Text style={styles.sectionTitle}>{t('settings.appSettings')}</Text>
      <View style={styles.group}>
        <SettingsRow
          detail={t('settings.languageDescription')}
          label={t('settings.language')}
          onPress={() => onSelect('language')}
        />
        <SettingsRow
          detail={t('settings.displaySubtitle')}
          label={t('settings.displaySettings')}
          onPress={() => onSelect('display')}
        />
        <SettingsRow
          detail={t('settings.subscriptionSubtitle')}
          label={t('settings.subscription')}
          onPress={() => onSelect('subscription')}
        />
        <SettingsRow
          detail={t('settings.syncSubtitle')}
          label={t('settings.cloudSync')}
          onPress={() => onSelect('sync')}
        />
      </View>
      <Text style={styles.sectionTitle}>
        {t('settings.homeSectionSupport')}
      </Text>
      <View style={styles.group}>
        <SettingsRow
          label={t('settings.developerMode')}
          onPress={() => onSelect('developer')}
        />
        <SettingsRow
          label={t('settings.feedback')}
          onPress={() => onSelect('feedback')}
        />
        <SettingsRow label="모든 로그 보기" onPress={() => onSelect('logs')} />
        <SettingsRow
          label={t('settings.versionInfo')}
          onPress={() => onSelect('version')}
        />
      </View>
    </ScrollView>
  );
}

function AccountSummary({ onPress }: { onPress: () => void }) {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  useEffect(() => {
    if (!user) {
      setProfile(defaultUserProfile);
      return;
    }
    let active = true;
    void loadLocalProfile(user.uid).then((value) => {
      if (active) setProfile(value);
    });
    void loadCloudProfile(user.uid)
      .then((value) => {
        if (active && value) setProfile(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const title =
    profile.name ||
    user?.displayName ||
    user?.email ||
    t('account.notSignedIn');
  const providers = user?.providerData
    .map(({ providerId }) => providerLabel(providerId))
    .filter((provider, index, all) => all.indexOf(provider) === index)
    .join(' · ');
  const detail = user
    ? [profile.primaryPart, providers].filter(Boolean).join(' · ') ||
      t('settings.accountSubtitle')
    : t('account.cloudNotice');
  const initial = user
    ? (profile.name || user.displayName || user.email || 'M')
        .trim()
        .charAt(0)
        .toUpperCase()
    : '👤';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.accountSummary,
        pressed && styles.accountSummaryPressed,
      ]}
    >
      <View
        style={[
          styles.avatar,
          user ? { backgroundColor: profile.color } : undefined,
        ]}
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.accountText}>
        <Text numberOfLines={1} style={styles.accountName}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.accountDetail}>
          {detail}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function providerLabel(providerId: string): string {
  if (providerId === 'password') return t('account.email');
  if (providerId === 'google.com') return 'Google';
  if (providerId === 'apple.com') return 'Apple';
  return providerId;
}

function SettingsRouteContent({ route }: { route: SettingsRoute }) {
  if (route === 'language') return <LanguageSettingsScreen />;
  if (route === 'display') return <DisplaySettingsScreen />;
  if (route === 'account') return <AccountSettingsScreen />;
  if (route === 'subscription') return <SubscriptionSettingsScreen />;
  if (route === 'sync') return <CloudSyncSettingsScreen />;
  if (route === 'developer') return <DeveloperSettingsScreen />;
  if (route === 'feedback') return <FeedbackSettingsScreen />;
  if (route === 'logs') return <AllLogsScreen />;
  if (route === 'version') return <VersionSettingsScreen />;
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{getRouteLabel(route)}</Text>
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
    height: SCREEN_HEADER_HEIGHT,
    paddingHorizontal: 20,
  },
  backButton: { paddingVertical: 12, width: 130 },
  backLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
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
  accountSummary: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 18,
  },
  accountSummaryPressed: { opacity: 0.7 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  accountText: { flex: 1, marginLeft: 14 },
  accountName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  accountDetail: { color: colors.muted, fontSize: 13, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 28, marginLeft: 12 },
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
