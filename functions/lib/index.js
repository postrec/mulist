"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredShares = exports.adminSaveNormalizationCatalog = exports.adminSetUserDisabled = exports.adminGetDashboard = exports.acceptFriendRequest = exports.sendFriendRequest = exports.inviteSetlistUser = exports.acceptTeamInvite = exports.createTeamInvite = exports.importSharedSong = exports.createThreeDayShare = exports.redeemSubscriptionCode = void 0;
const node_crypto_1 = require("node:crypto");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const bucket = (0, storage_1.getStorage)().bucket();
const region = 'asia-northeast3';
const adminEmails = new Set(['sion@sionuu.com']);
const adminFunctionOptions = {
    enforceAppCheck: false,
    invoker: 'public',
    region,
};
exports.redeemSubscriptionCode = (0, https_1.onCall)({ region, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const normalizedCode = requiredString(request.data?.code, 'code')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    if (normalizedCode.length < 8 || normalizedCode.length > 64) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid redeem code.');
    }
    const codeId = (0, node_crypto_1.createHash)('sha256').update(normalizedCode).digest('hex');
    const now = firestore_1.Timestamp.now();
    const result = await db.runTransaction(async (transaction) => {
        const codeRef = db.doc(`redeemCodes/${codeId}`);
        const redemptionRef = codeRef.collection('redemptions').doc(uid);
        const attemptRef = db.doc(`redeemAttempts/${uid}`);
        const entitlementRef = db.doc(`entitlements/${uid}`);
        const [codeSnapshot, redemptionSnapshot, attemptSnapshot, entitlementSnapshot,] = await Promise.all([
            transaction.get(codeRef),
            transaction.get(redemptionRef),
            transaction.get(attemptRef),
            transaction.get(entitlementRef),
        ]);
        const attempt = attemptSnapshot.data();
        const windowStart = attempt?.windowStartedAt;
        const inWindow = windowStart && now.toMillis() - windowStart.toMillis() < 60_000;
        const attemptCount = inWindow ? Number(attempt?.count ?? 0) : 0;
        if (attemptCount >= 5)
            return 'rate-limited';
        transaction.set(attemptRef, {
            count: attemptCount + 1,
            windowStartedAt: inWindow ? windowStart : now,
            updatedAt: now,
        });
        if (redemptionSnapshot.exists) {
            const entitlement = entitlementSnapshot.data();
            const existingExpiry = entitlement?.expiresAt;
            if (entitlement?.plan === 'premium' &&
                (!existingExpiry || existingExpiry.toMillis() > now.toMillis())) {
                return 'already-redeemed';
            }
            return 'already-used';
        }
        const code = codeSnapshot.data();
        const expiresAt = code?.expiresAt;
        const redemptionCount = Number(code?.redemptionCount ?? 0);
        const maxRedemptions = Number(code?.maxRedemptions ?? 0);
        if (!codeSnapshot.exists ||
            code?.active !== true ||
            code?.plan !== 'premium' ||
            (expiresAt && expiresAt.toMillis() <= now.toMillis()) ||
            maxRedemptions <= 0 ||
            redemptionCount >= maxRedemptions) {
            return 'invalid';
        }
        const entitlementExpiresAt = code?.entitlementExpiresAt ?? null;
        transaction.update(codeRef, {
            redemptionCount: redemptionCount + 1,
            lastRedeemedAt: now,
        });
        transaction.set(redemptionRef, { redeemedAt: now, uid });
        transaction.set(entitlementRef, {
            expiresAt: entitlementExpiresAt,
            plan: 'premium',
            redeemCodeId: codeId,
            source: 'redeem',
            updatedAt: now,
        }, { merge: true });
        return 'redeemed';
    });
    if (result === 'rate-limited')
        throw new https_1.HttpsError('resource-exhausted', 'Too many redeem attempts.');
    if (result === 'invalid')
        throw new https_1.HttpsError('not-found', 'Invalid or expired redeem code.');
    if (result === 'already-used')
        throw new https_1.HttpsError('failed-precondition', 'Redeem code was already used.');
    return { plan: 'premium', status: result };
});
exports.createThreeDayShare = (0, https_1.onCall)({ region, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const songId = requiredString(request.data?.songId, 'songId');
    const source = await db.doc(`users/${uid}/songs/${songId}`).get();
    if (!source.exists || source.data()?.deletedAt)
        throw new https_1.HttpsError('not-found', 'Song not found.');
    const shareId = (0, node_crypto_1.randomUUID)();
    const expiresAt = firestore_1.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await copyPrefix(`users/${uid}/songs/${songId}/`, `shares/${shareId}/`);
    const { favorite: _favorite, ...sharedSong } = source.data() ?? {};
    await db.doc(`shares/${shareId}`).set({
        ownerId: uid,
        songId,
        song: sharedSong,
        createdAt: firestore_1.Timestamp.now(),
        expiresAt,
    });
    return {
        shareId,
        expiresAt: expiresAt.toMillis(),
        url: `https://mulist-sionuu.web.app/share/${shareId}`,
    };
});
exports.importSharedSong = (0, https_1.onCall)({ region, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const shareId = requiredString(request.data?.shareId, 'shareId');
    const share = await db.doc(`shares/${shareId}`).get();
    const data = share.data();
    if (!data || data.expiresAt.toMillis() <= Date.now())
        throw new https_1.HttpsError('failed-precondition', 'Share expired.');
    const songId = (0, node_crypto_1.randomUUID)();
    await copyPrefix(`shares/${shareId}/`, `users/${uid}/songs/${songId}/`);
    await db.doc(`users/${uid}/songs/${songId}`).set({
        ...data.song,
        favorite: false,
        revision: 1,
        deviceId: 'share-import',
        updatedAt: firestore_1.Timestamp.now(),
        deletedAt: null,
    });
    return { songId };
});
exports.createTeamInvite = (0, https_1.onCall)({ region, enforceAppCheck: true }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const teamId = requiredString(request.data?.teamId, 'teamId');
    const email = requiredString(request.data?.email, 'email').toLowerCase();
    const member = await db.doc(`teams/${teamId}/members/${uid}`).get();
    if (!['owner', 'admin'].includes(member.data()?.role))
        throw new https_1.HttpsError('permission-denied', 'Admin role required.');
    const inviteId = (0, node_crypto_1.randomUUID)();
    await db.doc(`teamInvites/${inviteId}`).set({
        teamId,
        email,
        role: request.data?.role ?? 'viewer',
        createdBy: uid,
        createdAt: firestore_1.Timestamp.now(),
    });
    return { inviteId };
});
exports.acceptTeamInvite = (0, https_1.onCall)({ region, enforceAppCheck: true }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const inviteId = requiredString(request.data?.inviteId, 'inviteId');
    const inviteRef = db.doc(`teamInvites/${inviteId}`);
    const invite = await inviteRef.get();
    const data = invite.data();
    if (!data || request.auth?.token.email?.toLowerCase() !== data.email)
        throw new https_1.HttpsError('permission-denied', 'Invite does not match account.');
    await db
        .doc(`teams/${data.teamId}/members/${uid}`)
        .set({ role: data.role, email: data.email, joinedAt: firestore_1.Timestamp.now() });
    await inviteRef.delete();
    return { teamId: data.teamId };
});
exports.inviteSetlistUser = (0, https_1.onCall)({ region, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const setlistId = requiredString(request.data?.setlistId, 'setlistId');
    const email = requiredString(request.data?.email, 'email').toLowerCase();
    const role = request.data?.role === 'editor' ? 'editor' : 'viewer';
    const setlist = await db.doc(`users/${uid}/setlists/${setlistId}`).get();
    if (!setlist.exists)
        throw new https_1.HttpsError('not-found', 'Setlist not found in Cloud.');
    let target;
    try {
        target = await (0, auth_1.getAuth)().getUserByEmail(email);
    }
    catch {
        throw new https_1.HttpsError('not-found', 'MuList user not found.');
    }
    const batch = db.batch();
    const sharedRef = db.doc(`sharedSetlists/${setlistId}`);
    batch.set(sharedRef, {
        ownerId: uid,
        setlist: setlist.data(),
        updatedAt: firestore_1.Timestamp.now(),
    }, { merge: true });
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
        updatedAt: firestore_1.Timestamp.now(),
    });
    await batch.commit();
    return {
        displayName: target.displayName ?? null,
        email,
        role,
        uid: target.uid,
    };
});
exports.sendFriendRequest = (0, https_1.onCall)({ region, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const email = requiredString(request.data?.email, 'email').toLowerCase();
    let target;
    try {
        target = await (0, auth_1.getAuth)().getUserByEmail(email);
    }
    catch {
        throw new https_1.HttpsError('not-found', 'MuList user not found.');
    }
    if (target.uid === uid)
        throw new https_1.HttpsError('invalid-argument', 'Cannot add yourself.');
    const sender = await (0, auth_1.getAuth)().getUser(uid);
    const now = firestore_1.Timestamp.now();
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
});
exports.acceptFriendRequest = (0, https_1.onCall)({ region, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request.auth?.uid);
    const friendUid = requiredString(request.data?.friendUid, 'friendUid');
    const requestRef = db.doc(`users/${uid}/friendRequests/${friendUid}`);
    const incoming = await requestRef.get();
    if (!incoming.exists)
        throw new https_1.HttpsError('not-found', 'Friend request not found.');
    const [user, friend] = await Promise.all([
        (0, auth_1.getAuth)().getUser(uid),
        (0, auth_1.getAuth)().getUser(friendUid),
    ]);
    const now = firestore_1.Timestamp.now();
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
});
exports.adminGetDashboard = (0, https_1.onCall)(adminFunctionOptions, async (request) => {
    requireAdmin(request.auth?.token.email);
    const [authUsers, files, songs, setlists, catalog, auditLogs] = await Promise.all([
        (0, auth_1.getAuth)().listUsers(1000),
        bucket.getFiles(),
        db.collectionGroup('songs').count().get(),
        db.collectionGroup('setlists').count().get(),
        db.doc('catalog/normalization').get(),
        db
            .collection('adminAuditLogs')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get(),
    ]);
    const storageBytes = files[0].reduce((total, file) => total + Number(file.metadata.size ?? 0), 0);
    return {
        catalog: catalog.data() ?? { artists: [], tags: [] },
        auditLogs: auditLogs.docs.map((item) => ({
            id: item.id,
            ...item.data(),
        })),
        metrics: {
            firestoreSongs: songs.data().count,
            firestoreSetlists: setlists.data().count,
            storageBytes,
            storageFiles: files[0].length,
            users: authUsers.users.length,
        },
        users: authUsers.users.map((user) => ({
            createdAt: user.metadata.creationTime,
            disabled: user.disabled,
            displayName: user.displayName ?? null,
            email: user.email ?? null,
            lastSignInAt: user.metadata.lastSignInTime,
            uid: user.uid,
        })),
    };
});
exports.adminSetUserDisabled = (0, https_1.onCall)(adminFunctionOptions, async (request) => {
    const email = requireAdmin(request.auth?.token.email);
    const uid = requiredString(request.data?.uid, 'uid');
    const disabled = request.data?.disabled;
    if (typeof disabled !== 'boolean')
        throw new https_1.HttpsError('invalid-argument', 'disabled must be boolean.');
    const user = await (0, auth_1.getAuth)().updateUser(uid, { disabled });
    await writeAdminAudit(email, 'user.disabled', uid, { disabled });
    return { disabled: user.disabled, uid };
});
exports.adminSaveNormalizationCatalog = (0, https_1.onCall)(adminFunctionOptions, async (request) => {
    const email = requireAdmin(request.auth?.token.email);
    const tags = catalogItems(request.data?.tags, 'tags');
    const artists = catalogItems(request.data?.artists, 'artists');
    await db.doc('catalog/normalization').set({
        artists,
        tags,
        updatedAt: firestore_1.Timestamp.now(),
        updatedBy: email,
    });
    await writeAdminAudit(email, 'catalog.saved', 'catalog/normalization', {
        artists: artists.length,
        tags: tags.length,
    });
    return { artists: artists.length, tags: tags.length };
});
exports.cleanupExpiredShares = (0, scheduler_1.onSchedule)({ region, schedule: 'every 24 hours' }, async () => {
    const expired = await db
        .collection('shares')
        .where('expiresAt', '<=', firestore_1.Timestamp.now())
        .get();
    for (const share of expired.docs) {
        await deletePrefix(`shares/${share.id}/`);
        await share.ref.delete();
    }
});
function requireUid(uid) {
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in required.');
    return uid;
}
function requireAdmin(email) {
    const normalized = typeof email === 'string' ? email.toLowerCase() : '';
    if (!adminEmails.has(normalized))
        throw new https_1.HttpsError('permission-denied', 'Admin access required.');
    return normalized;
}
function catalogItems(value, name) {
    if (!Array.isArray(value) || value.length > 500)
        throw new https_1.HttpsError('invalid-argument', `${name} must be an array.`);
    return value.map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item))
            throw new https_1.HttpsError('invalid-argument', `${name}[${index}] is invalid.`);
        const record = item;
        if (typeof record.id !== 'string' || !record.id.trim())
            throw new https_1.HttpsError('invalid-argument', `${name}[${index}].id is required.`);
        return record;
    });
}
async function writeAdminAudit(email, action, target, details) {
    await db.collection('adminAuditLogs').add({
        action,
        actorEmail: email,
        createdAt: firestore_1.Timestamp.now(),
        details,
        target,
    });
}
function requiredString(value, name) {
    if (typeof value !== 'string' || !value.trim())
        throw new https_1.HttpsError('invalid-argument', `${name} is required.`);
    return value.trim();
}
async function copyPrefix(from, to) {
    const [files] = await bucket.getFiles({ prefix: from });
    await Promise.all(files.map((file) => file.copy(`${to}${file.name.slice(from.length)}`)));
}
async function deletePrefix(prefix) {
    await bucket.deleteFiles({ prefix, force: true });
}
//# sourceMappingURL=index.js.map