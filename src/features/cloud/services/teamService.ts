import { randomUUID } from 'expo-crypto';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../../config/firebase';
import type { Team, TeamRole } from '../../../domain/models';

export async function createTeam(uid: string, name: string): Promise<Team> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const team = {
    id,
    name: name.trim(),
    ownerId: uid,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(firestore, 'teams', id), {
    name: team.name,
    ownerId: uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  await setDoc(doc(firestore, 'teams', id, 'members', uid), {
    role: 'owner',
    joinedAt: Timestamp.now(),
  });
  return team;
}

export async function updateTeam(teamId: string, name: string): Promise<void> {
  await setDoc(
    doc(firestore, 'teams', teamId),
    { name: name.trim(), updatedAt: Timestamp.now() },
    { merge: true },
  );
}

export async function inviteTeamMember(
  teamId: string,
  email: string,
  role: TeamRole,
): Promise<string> {
  const result = await httpsCallable<
    { teamId: string; email: string; role: TeamRole },
    { inviteId: string }
  >(
    firebaseFunctions,
    'createTeamInvite',
  )({ teamId, email, role });
  return result.data.inviteId;
}

export async function acceptTeamInvite(inviteId: string): Promise<string> {
  const result = await httpsCallable<{ inviteId: string }, { teamId: string }>(
    firebaseFunctions,
    'acceptTeamInvite',
  )({ inviteId });
  return result.data.teamId;
}

export async function listTeamSongIds(
  teamId: string,
): Promise<readonly string[]> {
  const snapshot = await getDocs(
    collection(firestore, 'teams', teamId, 'songs'),
  );
  return snapshot.docs.map((item) => item.id);
}
