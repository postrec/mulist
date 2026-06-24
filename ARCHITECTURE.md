# ARCHITECTURE.md

# Frontend

- iPad: React Native, Expo Managed Workflow, TypeScript
- Web Client and Admin: Next.js, React, TypeScript
- iPad remains the primary performance and offline surface.

# Local Application

- SQLite is the source of truth for the running app.
- UI reads and writes SQLite before cloud synchronization.
- Local Song Package files support fully offline PDF viewing and annotation.
- A persistent Sync Queue retries cloud work when connectivity returns.

# Firebase Backend

- Firebase Authentication
  - Google Sign-In
  - Sign in with Apple for iOS
- Cloud Firestore
  - User profiles
  - Song and Setlist metadata
  - Sync revisions and deletion tombstones
  - Share records
  - Team membership and roles
  - Subscription entitlements
  - Multilingual tag and artist normalization catalog
  - Administrator audit logs
- Firebase Storage
  - PDF files
  - Annotation JSON
  - OCR JSON
  - Song Package attachments
- Cloud Functions
  - Three-day sharing links
  - Share import authorization
  - Subscription receipt/webhook verification
  - Expired share cleanup
  - Server-authorized Web Admin operations

Normalization Catalog:

- `catalog/normalization` stores canonical multilingual tag and artist records.
- Native clients keep an AsyncStorage cache and subscribe while authenticated.
- Stable tag IDs remain in Song records; labels and aliases can change independently.
- Artist aliases support filename metadata detection without bundling every artist in an
  app release.
- Only callable Admin Functions may update the catalog. The current server allowlist is
  restricted to `sion@sionuu.com`.

---

# Domain Model

Song

- id
- ownerId
- title
- artist
- originalKey
- preferredKey
- bpm
- tags
- favorite
- createdAt
- updatedAt
- revision
- deletedAt

Score

- id
- songId
- pdfFile
- storagePath
- contentHash
- noteLayer
- ocrData

Setlist

- id
- ownerId
- title
- eventName
- eventDate
- updatedAt
- revision
- deletedAt

SetlistSong

- setlistId
- songId
- order

SyncQueueItem

- id
- entityType
- entityId
- operation
- attempts
- createdAt
- lastError

---

# Firestore Structure

```text
users/{uid}
users/{uid}/songs/{songId}
users/{uid}/setlists/{setlistId}
shares/{shareId}
teams/{teamId}
teams/{teamId}/members/{uid}
entitlements/{uid}
```

Firestore stores searchable metadata and synchronization state. Large PDF, note,
OCR, and attachment payloads belong in Firebase Storage, not Firestore.

# Firebase Storage Structure

```text
users/{uid}/songs/{songId}/
├ metadata.json
├ score_01.pdf
├ score_01_notes.json
├ score_01_ocr.json
├ score_02.pdf
├ score_02_notes.json
├ score_02_ocr.json
└ attachments/
```

The local Song Package mirrors this layout under the app document directory.

---

# Sync Strategy

Sync Unit:
Song Package

Offline First:
SQLite / Local Files → Sync Queue → Firestore / Firebase Storage

Download:
Firestore metadata → required Storage files → SQLite / Local Files

Web-to-iPad delivery:

1. The Web Client uploads PDF, sidecar, and manifest files to Firebase Storage.
2. The Web Client creates the Firestore Song document only after all files finish.
3. Authenticated iPad clients subscribe to `users/{uid}/songs` while Cloud Sync is
   enabled.
4. A newer remote revision downloads and normalizes the Song Package before SQLite is
   updated, then refreshes the local Library.
5. Library pull-to-refresh performs the same full remote revision comparison as a
   manual recovery path.

Conflict Strategy:
Last Write Wins using server timestamp and revision

Required Sync Metadata:

- ownerId
- deviceId
- revision
- updatedAt
- serverUpdatedAt
- syncStatus
- deletedAt tombstone

Upload order:

1. Upload changed Song Package files to Firebase Storage.
2. Update Firestore metadata and revision.
3. Remove the successful item from the local Sync Queue.

Deletion is synchronized as a tombstone before remote files are permanently removed.

---

# Authentication

- Google Sign-In is the primary login option.
- Sign in with Apple is also provided on iOS.
- Firebase UID is the stable cloud owner identifier.
- Free local-only use does not require authentication.
- Authentication is required for backup, sync, sharing, and team features.
- Firebase service-account credentials must never be included in the client app.

# Security

- Firestore and Storage Security Rules enforce owner or team membership access.
- App Check protects Firebase resources from unauthorized clients.
- Client-provided Premium or role values are never trusted.
- Cloud Functions use Admin SDK privileges only for validated server operations.

---

# OCR

Languages

- Korean
- English
- Japanese

Execution

- Background Processing
- Automatic Local Indexing
- OCR JSON synchronized as part of the Song Package

---

# Sharing

Share Unit:
Song Package

Expiration:
3 Days

Flow:

1. Cloud Function creates a random share record with `expiresAt`.
2. Recipient receives temporary authorized access to the Song Package.
3. Import creates a new Song in the recipient library.
4. Expired records and temporary access are removed automatically.

The operating-system share sheet used for Setlist PDF export is separate from Cloud
Song Package Sharing.

---

# Subscription

Purchase:
Apple In-App Purchase / StoreKit or RevenueCat

Verification:
Cloud Functions

Entitlement Storage:
`entitlements/{uid}` in Firestore

Rules:

- Firebase does not process the subscription purchase itself.
- The client cannot directly grant Premium access.
- Verified subscription events update the user's entitlement document.

---

# Limits

PDF Max Size:
50MB

PDF Per Song:
10

Trash Retention:
30 Days

Recent Songs:
30

Free Plan:
30 local Songs

Premium Plan:
Unlimited Songs, cloud backup, sync, sharing, and team features
