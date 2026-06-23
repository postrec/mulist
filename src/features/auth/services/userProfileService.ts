import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

import { firebaseAuth, firestore } from '../../../config/firebase';
import {
  defaultUserProfile,
  musicianParts,
  profileColors,
  type UserProfile,
} from '../domain/UserProfile';

const key = (uid: string) => `mulist.user-profile.${uid}`;

export async function loadLocalProfile(uid: string): Promise<UserProfile> {
  const value = await AsyncStorage.getItem(key(uid));
  if (!value) return defaultUserProfile;
  try {
    return normalizeProfile(JSON.parse(value) as Partial<UserProfile>);
  } catch {
    return defaultUserProfile;
  }
}

export async function loadCloudProfile(
  uid: string,
): Promise<UserProfile | null> {
  const snapshot = await getDoc(
    doc(firestore, 'users', uid, 'profile', 'main'),
  );
  if (!snapshot.exists()) return null;
  const profile = normalizeProfile(snapshot.data() as Partial<UserProfile>);
  await AsyncStorage.setItem(key(uid), JSON.stringify(profile));
  return profile;
}

export async function saveUserProfile(
  uid: string,
  profile: UserProfile,
): Promise<boolean> {
  const normalized = normalizeProfile(profile);
  await AsyncStorage.setItem(key(uid), JSON.stringify(normalized));
  try {
    if (firebaseAuth.currentUser?.uid === uid) {
      await updateProfile(firebaseAuth.currentUser, {
        displayName: normalized.name || null,
      });
    }
    await setDoc(
      doc(firestore, 'users', uid, 'profile', 'main'),
      { ...normalized, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return true;
  } catch {
    return false;
  }
}

function normalizeProfile(value: Partial<UserProfile>): UserProfile {
  return {
    bio: typeof value.bio === 'string' ? value.bio.slice(0, 160) : '',
    color: profileColors.includes(value.color as UserProfile['color'])
      ? (value.color as UserProfile['color'])
      : defaultUserProfile.color,
    name: typeof value.name === 'string' ? value.name.trim().slice(0, 30) : '',
    primaryPart: musicianParts.includes(
      value.primaryPart as NonNullable<UserProfile['primaryPart']>,
    )
      ? (value.primaryPart as UserProfile['primaryPart'])
      : null,
  };
}
