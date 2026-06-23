import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import {
  firebaseAuth,
  firebaseFunctions,
  firestore,
} from '../../../config/firebase';

export interface SocialUser {
  displayName: string | null;
  email: string | null;
  uid: string;
}

export async function listFriends(): Promise<readonly SocialUser[]> {
  const uid = requireUid();
  const snapshot = await getDocs(
    collection(firestore, 'users', uid, 'friends'),
  );
  return snapshot.docs.map((item) => toUser(item.id, item.data()));
}

export async function listFriendRequests(): Promise<readonly SocialUser[]> {
  const uid = requireUid();
  const snapshot = await getDocs(
    collection(firestore, 'users', uid, 'friendRequests'),
  );
  return snapshot.docs.map((item) => toUser(item.id, item.data()));
}

export async function sendFriendRequest(email: string): Promise<SocialUser> {
  const result = await httpsCallable<{ email: string }, SocialUser>(
    firebaseFunctions,
    'sendFriendRequest',
  )({ email });
  return result.data;
}

export async function acceptFriendRequest(friendUid: string): Promise<void> {
  await httpsCallable<{ friendUid: string }, { uid: string }>(
    firebaseFunctions,
    'acceptFriendRequest',
  )({ friendUid });
}

function requireUid(): string {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('친구 기능을 사용하려면 로그인해 주세요.');
  return uid;
}

function toUser(uid: string, data: Record<string, unknown>): SocialUser {
  return {
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
    email: typeof data.email === 'string' ? data.email : null,
    uid,
  };
}
