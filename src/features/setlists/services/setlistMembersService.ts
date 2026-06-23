import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../../config/firebase';

export type SetlistMemberRole = 'editor' | 'owner' | 'viewer';
export interface SetlistMember {
  displayName: string | null;
  email: string | null;
  role: SetlistMemberRole;
  uid: string;
}

export async function listSetlistMembers(
  setlistId: string,
): Promise<readonly SetlistMember[]> {
  const snapshot = await getDocs(
    collection(firestore, 'sharedSetlists', setlistId, 'members'),
  );
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      displayName:
        typeof data.displayName === 'string' ? data.displayName : null,
      email: typeof data.email === 'string' ? data.email : null,
      role: normalizeRole(data.role),
      uid: item.id,
    };
  });
}

export async function inviteSetlistUser(
  setlistId: string,
  email: string,
  role: Exclude<SetlistMemberRole, 'owner'>,
): Promise<SetlistMember> {
  const result = await httpsCallable<
    { email: string; role: 'editor' | 'viewer'; setlistId: string },
    SetlistMember
  >(
    firebaseFunctions,
    'inviteSetlistUser',
  )({ email, role, setlistId });
  return result.data;
}

function normalizeRole(value: unknown): SetlistMemberRole {
  if (value === 'owner' || value === 'editor') return value;
  return 'viewer';
}
