import { createHash, randomUUID } from 'node:crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

if (!getApps().length) initializeApp();
const db = getFirestore();
const bucket = getStorage().bucket();
const region = 'asia-northeast3';

export const redeemSubscriptionCode = onCall(
  { region, enforceAppCheck: false },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const normalizedCode = requiredString(request.data?.code, 'code')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (normalizedCode.length < 8 || normalizedCode.length > 64) {
      throw new HttpsError('invalid-argument', 'Invalid redeem code.');
    }

    const codeId = createHash('sha256').update(normalizedCode).digest('hex');
    const now = Timestamp.now();
    const result = await db.runTransaction(async (transaction) => {
      const codeRef = db.doc(`redeemCodes/${codeId}`);
      const redemptionRef = codeRef.collection('redemptions').doc(uid);
      const attemptRef = db.doc(`redeemAttempts/${uid}`);
      const entitlementRef = db.doc(`entitlements/${uid}`);
      const [
        codeSnapshot,
        redemptionSnapshot,
        attemptSnapshot,
        entitlementSnapshot,
      ] = await Promise.all([
        transaction.get(codeRef),
        transaction.get(redemptionRef),
        transaction.get(attemptRef),
        transaction.get(entitlementRef),
      ]);

      const attempt = attemptSnapshot.data();
      const windowStart = attempt?.windowStartedAt as Timestamp | undefined;
      const inWindow =
        windowStart && now.toMillis() - windowStart.toMillis() < 60_000;
      const attemptCount = inWindow ? Number(attempt?.count ?? 0) : 0;
      if (attemptCount >= 5) return 'rate-limited' as const;
      transaction.set(attemptRef, {
        count: attemptCount + 1,
        windowStartedAt: inWindow ? windowStart : now,
        updatedAt: now,
      });

      if (redemptionSnapshot.exists) {
        const entitlement = entitlementSnapshot.data();
        const existingExpiry = entitlement?.expiresAt as
          | Timestamp
          | null
          | undefined;
        if (
          entitlement?.plan === 'premium' &&
          (!existingExpiry || existingExpiry.toMillis() > now.toMillis())
        ) {
          return 'already-redeemed' as const;
        }
        return 'already-used' as const;
      }
      const code = codeSnapshot.data();
      const expiresAt = code?.expiresAt as Timestamp | null | undefined;
      const redemptionCount = Number(code?.redemptionCount ?? 0);
      const maxRedemptions = Number(code?.maxRedemptions ?? 0);
      if (
        !codeSnapshot.exists ||
        code?.active !== true ||
        code?.plan !== 'premium' ||
        (expiresAt && expiresAt.toMillis() <= now.toMillis()) ||
        maxRedemptions <= 0 ||
        redemptionCount >= maxRedemptions
      ) {
        return 'invalid' as const;
      }

      const entitlementExpiresAt =
        (code?.entitlementExpiresAt as Timestamp | null | undefined) ?? null;
      transaction.update(codeRef, {
        redemptionCount: redemptionCount + 1,
        lastRedeemedAt: now,
      });
      transaction.set(redemptionRef, { redeemedAt: now, uid });
      transaction.set(
        entitlementRef,
        {
          expiresAt: entitlementExpiresAt,
          plan: 'premium',
          redeemCodeId: codeId,
          source: 'redeem',
          updatedAt: now,
        },
        { merge: true },
      );
      return 'redeemed' as const;
    });

    if (result === 'rate-limited')
      throw new HttpsError('resource-exhausted', 'Too many redeem attempts.');
    if (result === 'invalid')
      throw new HttpsError('not-found', 'Invalid or expired redeem code.');
    if (result === 'already-used')
      throw new HttpsError(
        'failed-precondition',
        'Redeem code was already used.',
      );
    return { plan: 'premium', status: result };
  },
);

export const createThreeDayShare = onCall(
  { region, enforceAppCheck: false },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const songId = requiredString(request.data?.songId, 'songId');
    const source = await db.doc(`users/${uid}/songs/${songId}`).get();
    if (!source.exists || source.data()?.deletedAt)
      throw new HttpsError('not-found', 'Song not found.');
    const shareId = randomUUID();
    const expiresAt = Timestamp.fromMillis(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    );
    await copyPrefix(`users/${uid}/songs/${songId}/`, `shares/${shareId}/`);
    const { favorite: _favorite, ...sharedSong } = source.data() ?? {};
    await db.doc(`shares/${shareId}`).set({
      ownerId: uid,
      songId,
      song: sharedSong,
      createdAt: Timestamp.now(),
      expiresAt,
    });
    return {
      shareId,
      expiresAt: expiresAt.toMillis(),
      url: `https://mulist-sionuu.web.app/share/${shareId}`,
    };
  },
);

export const importSharedSong = onCall(
  { region, enforceAppCheck: false },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const shareId = requiredString(request.data?.shareId, 'shareId');
    const share = await db.doc(`shares/${shareId}`).get();
    const data = share.data();
    if (!data || data.expiresAt.toMillis() <= Date.now())
      throw new HttpsError('failed-precondition', 'Share expired.');
    const songId = randomUUID();
    await copyPrefix(`shares/${shareId}/`, `users/${uid}/songs/${songId}/`);
    await db.doc(`users/${uid}/songs/${songId}`).set({
      ...data.song,
      favorite: false,
      revision: 1,
      deviceId: 'share-import',
      updatedAt: Timestamp.now(),
      deletedAt: null,
    });
    return { songId };
  },
);

export const createTeamInvite = onCall(
  { region, enforceAppCheck: true },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const teamId = requiredString(request.data?.teamId, 'teamId');
    const email = requiredString(request.data?.email, 'email').toLowerCase();
    const member = await db.doc(`teams/${teamId}/members/${uid}`).get();
    if (!['owner', 'admin'].includes(member.data()?.role))
      throw new HttpsError('permission-denied', 'Admin role required.');
    const inviteId = randomUUID();
    await db.doc(`teamInvites/${inviteId}`).set({
      teamId,
      email,
      role: request.data?.role ?? 'viewer',
      createdBy: uid,
      createdAt: Timestamp.now(),
    });
    return { inviteId };
  },
);

export const acceptTeamInvite = onCall(
  { region, enforceAppCheck: true },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const inviteId = requiredString(request.data?.inviteId, 'inviteId');
    const inviteRef = db.doc(`teamInvites/${inviteId}`);
    const invite = await inviteRef.get();
    const data = invite.data();
    if (!data || request.auth?.token.email?.toLowerCase() !== data.email)
      throw new HttpsError(
        'permission-denied',
        'Invite does not match account.',
      );
    await db
      .doc(`teams/${data.teamId}/members/${uid}`)
      .set({ role: data.role, email: data.email, joinedAt: Timestamp.now() });
    await inviteRef.delete();
    return { teamId: data.teamId };
  },
);

export const inviteSetlistUser = onCall(
  { region, enforceAppCheck: false },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const setlistId = requiredString(request.data?.setlistId, 'setlistId');
    const email = requiredString(request.data?.email, 'email').toLowerCase();
    const role = request.data?.role === 'editor' ? 'editor' : 'viewer';
    const setlist = await db.doc(`users/${uid}/setlists/${setlistId}`).get();
    if (!setlist.exists)
      throw new HttpsError('not-found', 'Setlist not found in Cloud.');
    let target;
    try {
      target = await getAuth().getUserByEmail(email);
    } catch {
      throw new HttpsError('not-found', 'MuList user not found.');
    }
    const batch = db.batch();
    const sharedRef = db.doc(`sharedSetlists/${setlistId}`);
    batch.set(
      sharedRef,
      {
        ownerId: uid,
        setlist: setlist.data(),
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
    batch.set(sharedRef.collection('members').doc(uid), {
      email: request.auth?.token.email ?? null,
      role: 'owner',
      uid,
    });
    batch.set(sharedRef.collection('members').doc(target.uid), {
      displayName: target.displayName ?? null,
      email,
      role,
      uid: target.uid,
    });
    batch.set(db.doc(`users/${target.uid}/setlistInvites/${setlistId}`), {
      invitedBy: uid,
      role,
      setlistId,
      updatedAt: Timestamp.now(),
    });
    await batch.commit();
    return {
      displayName: target.displayName ?? null,
      email,
      role,
      uid: target.uid,
    };
  },
);

export const sendFriendRequest = onCall(
  { region, enforceAppCheck: false },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const email = requiredString(request.data?.email, 'email').toLowerCase();
    let target;
    try {
      target = await getAuth().getUserByEmail(email);
    } catch {
      throw new HttpsError('not-found', 'MuList user not found.');
    }
    if (target.uid === uid)
      throw new HttpsError('invalid-argument', 'Cannot add yourself.');
    const sender = await getAuth().getUser(uid);
    const now = Timestamp.now();
    const batch = db.batch();
    batch.set(db.doc(`users/${target.uid}/friendRequests/${uid}`), {
      createdAt: now,
      displayName: sender.displayName ?? null,
      email: sender.email ?? null,
      uid,
    });
    batch.set(db.doc(`users/${uid}/sentFriendRequests/${target.uid}`), {
      createdAt: now,
      displayName: target.displayName ?? null,
      email: target.email ?? email,
      uid: target.uid,
    });
    await batch.commit();
    return { displayName: target.displayName ?? null, email, uid: target.uid };
  },
);

export const acceptFriendRequest = onCall(
  { region, enforceAppCheck: false },
  async (request) => {
    const uid = requireUid(request.auth?.uid);
    const friendUid = requiredString(request.data?.friendUid, 'friendUid');
    const requestRef = db.doc(`users/${uid}/friendRequests/${friendUid}`);
    const incoming = await requestRef.get();
    if (!incoming.exists)
      throw new HttpsError('not-found', 'Friend request not found.');
    const [user, friend] = await Promise.all([
      getAuth().getUser(uid),
      getAuth().getUser(friendUid),
    ]);
    const now = Timestamp.now();
    const batch = db.batch();
    batch.set(db.doc(`users/${uid}/friends/${friendUid}`), {
      displayName: friend.displayName ?? null,
      email: friend.email ?? null,
      friendsSince: now,
      uid: friendUid,
    });
    batch.set(db.doc(`users/${friendUid}/friends/${uid}`), {
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      friendsSince: now,
      uid,
    });
    batch.delete(requestRef);
    batch.delete(db.doc(`users/${friendUid}/sentFriendRequests/${uid}`));
    await batch.commit();
    return { uid: friendUid };
  },
);

export const cleanupExpiredShares = onSchedule(
  { region, schedule: 'every 24 hours' },
  async () => {
    const expired = await db
      .collection('shares')
      .where('expiresAt', '<=', Timestamp.now())
      .get();
    for (const share of expired.docs) {
      await deletePrefix(`shares/${share.id}/`);
      await share.ref.delete();
    }
  },
);

function requireUid(uid: string | undefined): string {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  return uid;
}
function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new HttpsError('invalid-argument', `${name} is required.`);
  return value.trim();
}
async function copyPrefix(from: string, to: string): Promise<void> {
  const [files] = await bucket.getFiles({ prefix: from });
  await Promise.all(
    files.map((file) => file.copy(`${to}${file.name.slice(from.length)}`)),
  );
}
async function deletePrefix(prefix: string): Promise<void> {
  await bucket.deleteFiles({ prefix, force: true });
}
