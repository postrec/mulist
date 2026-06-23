# PROGRESS.md

## 2026-06-21 — Initial MVP Foundation

- Created an Expo Managed Workflow project with Expo SDK 56 and TypeScript.
- Enabled strict TypeScript checks, including unchecked index and override checks.
- Added ESLint (Expo flat config) and Prettier configuration.
- Adopted a simple feature-based structure:
  - `src/domain/models` for business entities.
  - `src/features/library` for Library UI.
  - `src/shared` for reusable UI and theme values.
- Defined Song as the primary domain entity and Score as its PDF child resource.
- Added minimal Score, Setlist, and SetlistSong models in task order without adding
  persistence or future-feature behavior.
- Implemented the Library as the root screen. It accepts Song data through props so
  the upcoming local repository can be connected without coupling storage to UI.
- Kept PDF import as an unconnected entry point because Import tasks have not started.

## Scope Decisions

- No MusicXML, chord detection, or transpose functionality was introduced.
- No cloud, sync, OCR pipeline, or PDF rendering behavior was introduced.
- The initial UI prioritizes a clear, responsive iPad library layout over animation.

## 2026-06-21 — Offline Storage Foundation

- Added the Expo SQLite dependency and a lazy, shared database initializer.
- Added a versioned v1 schema for songs, scores, setlists, and ordered setlist songs.
- Enabled foreign keys and WAL mode for integrity and Offline First performance.
- Added indexes for recent-song, trash, Score lookup, and Setlist ordering paths.
- Implemented Song, Score, and Setlist repositories with typed row mapping and
  parameterized SQL.
- Kept repository construction outside the UI so Library can consume storage through
  a later feature-level data hook without introducing global state.
- Reserved `deleted_at` in the Song table for the upcoming Trash task; current
  repository reads exclude trashed rows, while trash behavior itself is not yet
  implemented.

### Verification

- Storage code passed strict TypeScript verification against a temporary declaration
  matching the Expo SQLite async API.
- Every new source file remains below the 300-line component limit.

## 2026-06-21 — Library MVP Features

- Connected the root Library screen to SQLite through a feature-level hook.
- Added the five Library views: All, Recent, Favorites, Tags, and Trash.
- Recent returns at most 30 active Songs ordered by `updated_at`; this is the current
  MVP interpretation until PDF viewing introduces an explicit last-opened timestamp.
- Added favorite toggling and tag discovery/filtering without introducing global state.
- Added soft deletion, restoration, and automatic permanent deletion after 30 days.
  Foreign-key cascades keep a permanently deleted Song Package internally consistent.
- Added loading, empty, and recoverable error states to the Library UI.
- Kept import and PDF opening callbacks separate because those task groups have not
  started yet.

### Verification

- Strict TypeScript verification passed with a temporary declaration matching the
  Expo SQLite async API; no `any` types were introduced.
- All source files and UI components remain under 300 lines.

## 2026-06-21 — PDF Import Pipeline

- Added Expo Document Picker, File System, and Crypto dependencies at SDK 56-compatible
  versions from Expo's bundled native-module map.
- Added one Library import action that accepts either a single PDF or multiple PDFs.
  Batch failures are isolated so one bad file does not cancel successful imports.
- Enforced PDF-only selection and the architecture's 50MB-per-file limit.
- Each selected PDF creates one Song and one child Score in an Offline First Song
  Package directory under `song-packages/<songId>/`.
- Song Packages currently contain `metadata.json` and `score_01.pdf`; notes and OCR
  files are intentionally deferred to their respective task groups.
- Auto title detection removes the PDF extension and interprets the filename pattern
  `Artist - Title`; filenames without that separator use `아티스트 미상`.
- Added a nullable Score content hash through database migration v2 and a partial
  unique index. Existing matching PDFs are skipped during single or batch import.
  MD5 is used only for file equality via the native file API, not for security.
- Import rollback removes both database rows and copied package files when persistence
  fails. Expired Trash cleanup now removes the Song Package before its database row.

### Verification

- Strict TypeScript verification passed against temporary declarations matching the
  SDK 56 native APIs used by the implementation.
- No `any`, MusicXML, chord detection, or transpose implementation was introduced.
- Every source file remains below 300 lines.

## 2026-06-21 — PDF Viewer and Live Annotations

- Added local iPad PDF rendering through a file-enabled WebView and connected Song
  selection from Library and Search.
- PDF viewing locks to landscape and restores the previous orientation on exit.
- Added a normalized, pressure-aware annotation layer with pen, highlighter, eraser,
  and iOS text-note tools. Note layers persist through Score Repository.
- Opening a PDF now records `last_opened_at` through database migration v4, so Recent
  Songs reflects actual performance use instead of metadata edits.

## 2026-06-21 — OCR and Search Foundation

- Added persistent OCR jobs with pending, processing, completed, and failed states,
  plus a three-attempt retry limit.
- Added a serialized background queue runner that yields between jobs.
- Added database migration v3 with a Song search index maintained by Song and Score
  repositories.
- Added debounced, scoped search for title, artist, tags, and OCR text.
- Kept the OCR recognizer behind a typed adapter because Expo Managed's bundled
  modules do not include scanned-PDF recognition for Korean, English, and Japanese.

## 2026-06-21 — Setlists and Music Tools

- Added an iPad two-column Setlist screen with create, metadata update, delete, Song
  addition, and persisted up/down ordering.
- Added printable Setlist PDF generation and the native share sheet.
- Added persisted BPM editing to the PDF performance toolbar.
- Added an Offline First metronome that generates its click WAV locally, plus a
  four-beat Count In that transitions into the metronome.

### Verification

- Every requested task was checked immediately after its implementation passed strict
  TypeScript verification against temporary declarations for the declared SDK 56
  native dependencies.
- No source file exceeds 300 lines and no `any` types were added.
- MusicXML, chord detection, and transpose remain unimplemented Future work.

## 2026-06-21 — Firebase Backend Decision

- Replaced the planned Next.js, Node.js, PostgreSQL, and generic object-storage MVP
  backend with Firebase Authentication, Firestore, Firebase Storage, and Cloud
  Functions.
- Kept SQLite and local Song Packages as the Offline First runtime source of truth.
- Assigned Google and Apple sign-in to Firebase Authentication.
- Assigned metadata, revisions, tombstones, team membership, share records, and
  entitlements to Firestore; large Song Package files remain in Firebase Storage.
- Assigned three-day sharing and subscription verification to Cloud Functions.
- Kept subscription purchasing with Apple StoreKit or RevenueCat rather than Firebase.
- Deferred Next.js/PostgreSQL to a later web phase unless Firebase proves insufficient.
- Expanded the Cloud task list into dependency-ordered Firebase setup, authentication,
  security, sync foundation, Song Package sync, sharing, and team milestones. No Cloud
  task was marked complete during planning.

## 2026-06-21 — Firebase Project Setup

- Created Firebase project `mulist-sionuu` with display name `MuList` under the
  authenticated `sion@sionuu.com` account.
- Set `mulist-sionuu` as the default project for the repository.
- Registered Firebase iOS app `MuList iOS` with bundle identifier `com.mulist.app` and
  app ID `1:930972135321:ios:629e462eebe2b3f788ed08`.
- Added `GoogleService-Info.plist`, Expo iOS configuration, and an idempotent Firebase
  JS SDK initializer using Firebase 12.15.0.
- Installed and locked all declared dependencies. Corrected `eslint-config-expo` to
  the published SDK 56-compatible version, then passed real TypeScript, ESLint, and
  Prettier checks.
- Installed Homebrew OpenJDK 21 for Firestore Emulator support.
- Configured Auth (`9099`), Firestore (`8080`), Storage (`9199`), and Emulator UI
  (`4000`) with environment-controlled app connections.
- Added deny-all baseline Firestore and Storage rules so local emulators start safely;
  owner/team access rules remain separate Security tasks.
- Started all three emulators together, verified their endpoints through the Emulator
  Hub, and performed a clean shutdown.

## 2026-06-22 — Expo Go SDK 54 Compatibility

- Downgraded Expo SDK 56 to SDK 54 because the current App Store Expo Go build on the
  target iPad supports SDK 54.
- Aligned React 19.1.0, React Native 0.81.5, TypeScript 5.9, Expo modules, WebView,
  SVG, and Expo ESLint configuration through `expo install --fix`.
- Added the SDK 54 `expo-asset` peer dependency to remove native module duplicates.
- Expo Doctor passed all 18 checks with no issues.
- TypeScript, ESLint, and Prettier checks passed against the real SDK 54 dependencies.
- Metro successfully produced the iOS Hermes bundle (2.15 MB, 764 modules).

## 2026-06-22 — Settings Foundation

- Added a Settings hub accessible from Library with internal navigation for Display,
  Account, Subscription, Cloud Sync, Developer, Feedback, and Version screens.
- Added SQLite migration v5 and a typed Settings Repository for persistent local
  preferences.
- Added Light, Dark, and System themes using iOS dynamic colors, font-size preference,
  PDF preferences, and functional Landscape Lock behavior.
- Added Firebase account information, logout, and authenticated account deletion.
- Added entitlement-based Free/Premium status display; purchasing remains blocked on
  the StoreKit/RevenueCat product decision.
- Added opt-in Developer Mode with OCR queue reset, OCR previews, database statistics
  and reset, Song Package storage inspection, sync readiness status, and test data.
- Added email-based Feedback with app/device/OS diagnostics and Version information
  with release notes and primary open-source license attribution.
- Added locally persisted Cloud Sync and Wi-Fi-only preferences for the future worker.
- TypeScript, ESLint, Prettier, and an SDK 54 iOS Hermes export all passed. The export
  contains 808 modules and a 3.99 MB bundle.

## 2026-06-22 — Portrait PDF Viewer Controls

- Changed the PDF Viewer baseline to portrait-friendly rotation while preserving the
  optional Landscape Lock preference.
- Added pinch-compatible PDF viewing plus explicit 50–250% zoom controls initialized
  from the saved Default Zoom preference.
- Added one-page/two-page switching through native PDF open parameters. The native
  iPad PDF renderer remains responsible for the final page layout.
- Reduced the viewer menu bar from 62pt minimum height to 48pt and made its controls
  horizontally scrollable on narrow portrait screens.
- Added a menu-bar entry for editing title, artist, and BPM, with validation and
  persistence through Song Repository and the search index.
- Refreshes Library after closing the viewer so edited metadata appears immediately.
- TypeScript, ESLint, Prettier, and an SDK 54 iOS Hermes export passed with 810 modules
  and a 4 MB bundle.

## 2026-06-22 — iPad PDF Viewer Correction

- Replaced the ineffective native `TwoPageRight` open parameter after target-iPad
  testing showed that iOS WebKit ignored it.
- Two-page mode now renders two independent PDF page views side by side and provides
  explicit spread navigation for 1–2, 3–4, and subsequent pairs.
- Extended zoom-out from 50% to 25%. Below 100%, the PDF viewport itself becomes
  narrower than its parent, allowing a portrait A4 page to fit fully within the
  available screen height while preserving native pinch zoom.
- TypeScript, ESLint, Prettier, and the SDK 54 iOS Hermes export passed with 811
  modules and a 4 MB bundle.

## 2026-06-22 — PDF.js Single-Document Viewer

- Superseded the temporary two-WebView implementation with Mozilla PDF.js 5.4.624
  running offline inside one Expo Go-compatible WebView.
- A single PDF.js document session now owns every page and switches its CSS grid
  between one-page and two-page spread layouts without loading the PDF twice.
- Added custom 25–250% pinch handling. Pinch movement reports integer zoom updates
  through the WebView bridge so the native menu-bar percentage stays synchronized;
  releasing the gesture re-renders canvases at the selected scale for sharp output.
- Bundled the PDF.js module and worker as Expo assets and copies them into the app
  document directory for local, offline execution beside Song Package PDFs.
- Added a reproducible `pdfjs:assets` synchronization script and PDF.js Apache-2.0
  attribution in Version Information.
- TypeScript, ESLint, and Prettier passed. The SDK 54 iOS export contains both PDF.js
  assets, 815 modules, and a 4.02 MB application bundle.

## 2026-06-22 — PDF.js WKWebView Loading Fix

- Target-iPad testing exposed `Importing a module script failed` because WKWebView
  rejected dynamic ES module imports from local `file://` URLs.
- Added an esbuild asset step that converts the PDF.js module and worker into Safari
  15-compatible classic IIFE scripts; the viewer now loads both with ordinary local
  script tags and does not execute dynamic imports.
- TypeScript, ESLint, Prettier, and the SDK 54 iOS export passed. Both rebuilt PDF.js
  assets are present in the exported bundle.

## 2026-06-22 — PDF.js Loading Stall Fix

- Target-iPad testing then showed the classic local scripts could still stall before
  execution, leaving the viewer at `PDF 불러오는 중…` indefinitely.
- Removed all WebView-local script and PDF URL loading: React Native now reads the
  bundled IIFE engine, worker, and Song Package PDF, then embeds the scripts and sends
  PDF bytes directly to one PDF.js document session.
- Added stage-specific status text, global JavaScript error forwarding, and a 15-second
  PDF loading timeout so future failures surface a concrete message instead of an
  endless loading state.
- TypeScript, ESLint, Prettier, and the SDK 54 iOS export passed with both PDF.js
  assets included.

## 2026-06-22 — PDF.js Worker Bootstrap Fix

- The next target-iPad error, `PDF.js 실행 오류: Script error.`, was traced to PDF.js
  attempting to start its default `pdf.worker.mjs` module URL after the main engine
  had loaded.
- PDF.js now receives an in-memory Blob URL containing the bundled worker. The worker
  initializes its own message port in one document session without any `file://` or
  external module request.
- Global WebView script events are retained as diagnostics rather than immediately
  replacing the viewer; document-loading failures still surface through the explicit
  PDF.js error and timeout paths.
- TypeScript, ESLint, Prettier, and the SDK 54 iOS export passed.

## 2026-06-22 — PDF.js Classic Script Syntax Fix

- The persistent `Script error.` was identified as a classic-script syntax failure:
  after removing ES module loading, the viewer bootstrap still contained top-level
  `await`, so none of the PDF initialization code could execute.
- Wrapped document loading and page creation in an async bootstrap function while
  keeping the PDF.js engine and Blob worker as classic-script-compatible assets.
- Added a generated-HTML syntax check that parsed all three WebView scripts
  successfully, then passed TypeScript, ESLint, Prettier, and the SDK 54 iOS export.

## 2026-06-22 — PDF.js Expo Go Fake Worker Fallback

- After syntax correction, target-iPad loading reached `getDocument()` but timed out,
  proving that the Blob module worker did not establish a usable WKWebView message
  channel in Expo Go.
- Disabled native Web Worker creation inside the viewer and executes the bundled
  PDF.js worker handler in the same WebView context. PDF parsing still uses one
  document session but no longer waits on an unsupported module-worker boundary.
- Extended the explicit load timeout to 45 seconds for larger Song Package PDFs.
- Generated HTML now passes syntax parsing for all four scripts; TypeScript, ESLint,
  Prettier, and the SDK 54 iOS export also passed.

## 2026-06-22 — Performance Viewer Workflow

- Renamed the Library eyebrow from `MY MUSIC` to `MULIST` and added a two-column Song
  grid specifically for iPad portrait layouts.
- Added SQLite migration v6 and Score-owned viewer state for page layout, current
  page, and scroll/swipe navigation mode. Reopening a Song restores all three values.
- Added a View popup for one/two-page selection and Scroll ON/OFF; OFF switches the
  single PDF.js document to horizontally snapping pages.
- Replaced top-level annotation buttons with a Drawing menu and a vertical pen,
  highlighter, and eraser toolbar at the lower-right of the score.
- Added full viewer-menu hide/show controls and removed Count In from performance
  controls.
- TypeScript, ESLint, Prettier, and the SDK 54 iOS export passed. The export contains
  814 modules and a 4.03 MB application bundle.

## 2026-06-22 — Canonical Tag Presets

- Added canonical tag IDs for K-Pop, J-Pop, Pop, R&B, anime, ballad, jazz, rock,
  metal, VTuber, game music, gugak, and Vocaloid.
- Each preset owns Korean, English, and spelling aliases; stored Song tags normalize
  to stable IDs while Library UI displays human-friendly labels.
- Added multi-select preset chips to Score Settings and connected tag changes to the
  existing Song Repository and search index update.
- Tag-scoped and global search now resolve aliases such as `한국노래`, `일본노래`,
  `알앤비`, and `버츄얼` to their canonical IDs.

## 2026-06-22 — Viewer Menu and Swipe Polish

- Moved Menu Hide after the music controls so it is the actual rightmost viewer-menu
  action.
- Anchored the View popup directly below its button with a transparent modal backdrop;
  tapping any area outside the popup now dismisses it.
- Reworked Scroll OFF to use a single horizontally scrolling PDF.js page container,
  lock competing document scroll, and snap single pages or two-page spreads.
- Current-page detection and restoration now normalize two-page mode to 1–2, 3–4,
  and subsequent spread boundaries.
- TypeScript, ESLint, Prettier, and the SDK 54 iOS export passed with 815 modules and a
  4.04 MB application bundle.

## 2026-06-22 — Discrete Swipe Pager

- Changed Scroll OFF from a horizontally overflowing document layout to a standard
  one-page pager: exactly one score page fills the viewport and each horizontal swipe
  snaps to the adjacent page.
- Swipe mode preserves the selected page layout. One-page mode advances by one page;
  two-page mode shows only the current spread and advances `1–2 → 3–4` by two pages.
- Replaced WebKit scroll-snap paging after device feedback showed inconsistent
  behavior. Swipe mode now keeps only the current page visible and changes exactly one
  page on each completed horizontal gesture; vertical gestures and two-finger pinch
  remain separate.
- Added a guarded 270ms two-stage slide transition: the current page or spread moves
  out before the adjacent page or spread enters, avoiding an abrupt render swap while
  preventing overlapping rapid-swipe animations.
- Made swipe transitions interactive: the visible page or spread follows horizontal
  finger movement, continues from the release position after crossing the threshold,
  or springs back when cancelled. First and last pages apply edge resistance.
- Swipe mode now keeps the adjacent previous and next page or spread positioned just
  outside the viewport, so dragging reveals the destination content before release.
- Expanded persisted navigation modes to Scroll, Snap, and Swipe. Snap preserves the
  continuous vertical document but smoothly aligns the nearest page or two-page spread
  start to the viewport when touch ends.

## 2026-06-22 — Firebase Cloud Foundation

- Added persistent Firebase Auth sessions with Google and Apple credential adapters;
  social-provider console activation and a development-build device check remain.
- Added SQLite v7/v8 cloud metadata, tombstones, retry queue, sync logs, teams, and
  membership storage while retaining SQLite and local Song Packages as source of truth.
- Implemented connectivity-aware backup/restore for Firestore metadata and Storage
  PDFs plus annotation, OCR, and viewer-state sidecars. Conflict handling uses revision
  first and updated time second, with soft-delete tombstones.
- Added owner-scoped Firestore/Storage rules and role-scoped team access. Both rulesets
  compiled successfully in the local Firebase emulators.
- Added App-Check-enforced Cloud Functions for three-day shares, expiration cleanup,
  share import, and team invitations, plus a Hosting fallback link and app deep link.
- App and Functions TypeScript builds pass. Production deployment is waiting for
  Firebase CLI reauthentication and Firebase/App Store provider configuration.

## 2026-06-23 — Expo Go Authentication Compatibility

- Removed eager loading of the native Google Sign-In package, which crashed Expo Go
  before React Native could render because `RNGoogleSignin` is not bundled there.
- Google Sign-In now loads only inside a compatible MuList development build and shows
  an actionable message when invoked from Expo Go. The rest of the app remains usable
  in Expo Go for PDF and local-library testing.

## 2026-06-23 — Email and Password Authentication

- Added Firebase email/password registration and sign-in as the provider-independent
  account path while Google OAuth and Apple Developer enrollment remain pending.
- Added credential validation, disabled-state handling, secure password input, and
  user-facing Firebase error messages to Account Settings.

## 2026-06-23 — Settings Account Summary

- Added a live Firebase account summary at the top of Settings Home with the user's
  display name or email and the active sign-in provider.
- The summary reacts to sign-in and sign-out changes and opens Account Settings when
  pressed; signed-out users see the existing Cloud sign-in guidance.

## 2026-06-23 — Musician Profile

- Fixed Account Settings to fall back to the authenticated email instead of showing
  `로그인하지 않음` when an email/password account has no Firebase display name.
- Added seven profile colors, editable name and 160-character bio, and a primary-part
  selector covering performance, composition, production, and lighting roles.
- Profile changes are saved locally first for offline access, mirrored to the Firebase
  Auth display name, and synchronized to the user's protected Firestore profile path.
- Settings Home now uses the saved profile color, name, and primary part.

## 2026-06-23 — Settings Account Navigation Cleanup

- Removed the duplicate Account row from the App Settings group. Account management
  remains available through the profile summary card at the top of Settings Home.

## 2026-06-23 — MuList Redeem Codes

- Added authenticated MuList code redemption to Subscription Settings with localized
  input, success, invalid-code, sign-in, and rate-limit states.
- Codes are normalized and SHA-256 hashed before lookup; plaintext codes are never
  stored. Firebase Functions atomically enforce activation, expiration, total-use
  limits, per-user uniqueness, and five attempts per minute.
- Successful redemption writes the protected entitlement document and immediately
  updates the current plan to Premium. A local admin generator prints secure codes and
  their Firestore document template.

## 2026-06-23 — Library Song Actions and Sync Status

- Added a long-press action menu to active Library songs with metadata editing,
  individual Cloud sync, and a red delete action with confirmation.
- Reused the validated score metadata editor for title, artist, BPM, and tags; edits
  immediately mark the Song Package pending for Cloud sync.
- Manual sync uploads the selected song's Firestore metadata and Firebase Storage PDF,
  annotation, OCR, and viewer-state sidecars, then clears its pending queue entry.
- Songs whose local sync status is not `synced` now show a cloud symbol immediately to
  the left of the title; it disappears after a successful upload and Library refresh.

## 2026-06-23 — Expo Go Firebase Storage Upload Fix

- Replaced React Native `ArrayBuffer`-backed Blob uploads, which Expo Go does not
  support, with Firebase Storage string uploads.
- PDFs are read directly from the Song Package as Base64 and uploaded with PDF content
  metadata; annotation/OCR/view-state sidecars use raw JSON strings without Blob
  construction.

## 2026-06-23 — Native File Resumable Storage Upload

- Device testing confirmed Firebase `uploadString` still converts its input into an
  unsupported React Native ArrayBuffer-backed Blob internally.
- Replaced Firebase's web upload implementation with its authenticated resumable REST
  protocol. Expo now streams the native Song Package `File` as the request body, while
  JSON sidecars upload as plain UTF-8 text; no Blob or ArrayBuffer construction occurs.

## 2026-06-23 — Storage Upload Stall Recovery

- Device testing showed Expo's fetch-based native File request could remain pending
  indefinitely during a resumable upload.
- PDF transfer now uses Expo FileSystem's native binary upload task after the
  authenticated resumable session is created. Session creation, JSON transfer, and PDF
  transfer have explicit timeouts; a stalled native task is cancelled and reports a
  concrete retryable error instead of leaving the Library at `동기화 중…`.

## 2026-06-23 — SQLite Song Save and Error Diagnostics

- Fixed the Song upsert SQL mismatch that supplied 15 placeholders for 16 columns and
  caused `prepareAsync` to fail when a sync result saved its cloud state.
- Added a shared `[MuList]` error reporter and connected user-facing Library, sync,
  account, subscription, metadata, setlist, OCR, import, and developer-tool failures to
  `console.error` with operation context and the original Error stack.

## 2026-06-23 — Complete Song Package Manifest

- Added a schema-versioned `metadata.json` to every synchronized Song Package, stored
  identically in the local package directory and Firebase Storage package root.
- The manifest mirrors all Firestore Song fields plus owner, song ID, sync state,
  `scoreIds`, server timestamp, Firestore document path, and every PDF/sidecar Storage
  path. Timestamps use portable ISO strings instead of Firebase-only Timestamp objects.
- Each per-score annotation/OCR/view-state sidecar now embeds the same complete Song
  manifest, while remaining backward-compatible with older flat score sidecars.

## 2026-06-23 — Setlist Inline Score Preview

- Reworked the iPad Setlists workspace into setlist navigation, song management, and a
  dedicated right-side score preview pane.
- The preview remains visually empty until a setlist song is selected. Selecting the
  song title loads its first PDF in the existing offline PDF.js renderer, always
  starting on page 1 with single-page layout regardless of the Song's saved viewer
  layout.

## 2026-06-23 — Setlist Performance Viewer Navigation

- Reduced the navigation and management panes so the right-side inline score preview
  owns substantially more of the iPad workspace.
- Replaced preview title/artist chrome with a focused `뷰어로 이동` action that opens
  the same full performance PDF Viewer used from Library.
- The full Viewer now receives the selected Setlist and ordered Songs, shows a compact
  bottom-left quick panel, and switches scores immediately when a row is pressed.
- Returning from the full Viewer restores the originating Setlist, selected preview
  Song, and three-pane workspace instead of dropping back to an empty Setlists state.

## 2026-06-23 — Performance and Collaboration UX

- Reduced the full Viewer Setlist panel to 190px and distributed all menu actions across
  the available header width. Unified Search, Setlists, Settings, Social, and Viewer
  headers on the shared 48px metric.
- Hidden-menu PDF taps now distinguish page content from document margins: page taps
  smoothly snap to that page, while margin taps reveal the menu. Visible-menu score
  taps retain the existing hide behavior.
- Improved Pencil strokes with pen pointer detection, pressure-responsive width,
  quadratic smoothing, duplicate-point filtering, cancellation handling, and basic
  palm-input rejection while Pencil input is active.
- Added explicit Setlist edit mode with inline rename, edit-only arrows, a draggable
  handle, and search-first Library additions. Added authenticated Setlist collaborator
  invitations with viewer/editor roles.
- Added an email-exact friend request workflow, incoming approvals, Friends list, and a
  Social screen placed between Setlists and PDF Import in Library navigation.
- Added long-press Song sharing through a three-day Firebase link and the native iOS
  share sheet, which includes AirDrop. Shared metadata removes `favorite`; imports
  always initialize it to `false`.
- Replaced the text cloud marker with Material Community Icons `cloud-outline`, and made
  status bars transparent so screen backgrounds extend through safe-area regions while
  controls remain inside safe insets.

## 2026-06-23 — Two-Page Horizontal Spread Sizing

- Fixed two-page horizontal navigation at 100% zoom to a deterministic viewport grid:
  page 1 uses 40%, page 2 uses 40%, and the spread keeps 10% outer margins on both
  sides.
- Horizontal page changes now align each odd-numbered spread start to the same 10%
  inset, so only the active two-page spread occupies the full viewport.
- Added a 10px gutter between the two pages while keeping the spread, including its
  gutter, inside the original 80% content width and preserving both 10% outer margins.

## 2026-06-23 — Four-Way Viewer Navigation Modes

- Split Viewer navigation into Vertical Scroll, Vertical Snap, Horizontal Scroll, and
  the new Horizontal Snap while preserving the legacy horizontal-scroll storage value.
- Horizontal Snap follows normal continuous finger scrolling, then aligns the nearest
  page or two-page spread to its start inset after momentum settles. Programmatic smooth
  alignment is guarded to prevent recursive snapping.

## 2026-06-23 — Pencil-Only Drawing and Safe Areas

- Moved live pen and highlighter capture into the PDF.js WebView using iOS Pointer
  Events. Only `pointerType: pen` is intercepted, so Apple Pencil draws while one- and
  two-finger gestures continue to scroll and zoom the score.
- Kept the React Native SVG annotation layer as a persisted render layer. It stops
  intercepting input while pen or highlighter is selected, then displays each completed
  WebView stroke after it is saved to the existing note sidecar.
- Replaced the horizontally scrolling Viewer menu container with a fixed flex row so
  every action remains in the top bar without lateral menu navigation.
- Installed `react-native-safe-area-context`, added a root `SafeAreaProvider`, and
  migrated all screen SafeAreaView imports. Status bars remain transparent while screen
  controls continue to respect device insets.

## 2026-06-23 — Page-Anchored Pencil Annotations

- Replaced the viewport-fixed annotation canvas with one transparent canvas inside
  every rendered PDF page. New strokes store their page number and page-normalized
  coordinates, so scrolling moves them with the score and zooming scales their
  position and width with the page.
- Pencil pointer capture now suppresses scrolling, snapping, and tap-menu gestures for
  the full duration of a pen, highlighter, or eraser action. Finger scrolling and
  two-finger zoom remain available whenever Pencil is not touching the display.
- Moved erasing into the same page-aware WebView input path and upgraded annotation
  sidecars to version 2. Version 1 strokes remain readable and are treated as first-page
  annotations because their original schema had no page identity.
- Replaced drawing-tool text with accessible Font Awesome pen, highlighter, and eraser
  icons.
- Pinch zoom now records the exact normalized PDF point beneath the gesture centroid
  and compensates the scroll offset after every scale update, preserving the user's
  focal point instead of zooming from the document's top-left corner.

## 2026-06-23 — Library Friend Label and Safer Deletion

- Renamed the visible Library navigation and destination title from `소셜` to `친구`.
- Removed the immediate delete control from active Song cards. Moving a Song to Trash
  now remains available only through the long-press action sheet and its confirmation;
  Trash-view restoration is unchanged.

## 2026-06-23 — Pencil Smoothing, Colors, and Share Preparation

- Stabilized pinch zoom by filtering sub-frame noise and limiting each zoom update's
  maximum delta while retaining page focal-point compensation.
- Added a persistent Apple Pencil curve-smoothing setting from 0 through 10, with a
  light default of 2. The PDF.js input bridge applies progressive point interpolation
  before its existing quadratic stroke rendering and preserves the raw final point.
- Added accessible color swatches above the drawing toolbar whenever Pen or Highlighter
  is selected. Each tool keeps its own session color and new strokes persist that color
  in the annotation sidecar.
- Sharing now checks the Song sync state. Pending or failed Songs upload automatically
  before the three-day link is created, while already-synced Songs skip the redundant
  package upload.

## 2026-06-23 — GPU Preview Pinch Zoom

- Replaced per-touch PDF page resizing with a two-phase pinch pipeline. During the
  gesture, the complete PDF.js page tree—including annotation canvases—uses one
  GPU-backed `translate3d + scale` transform and performs no document reflow or canvas
  rendering.
- Pinch updates are coalesced to one `requestAnimationFrame`, track both scale and
  centroid movement directly, and keep the original content point beneath the moving
  two-finger center.
- On gesture completion, MuList clears the preview transform, commits the final zoom
  once, restores the anchored page coordinate through one scroll correction, and then
  performs a single sharp PDF/annotation render. Page and snap calculations remain
  suspended until the commit is complete.

## 2026-06-23 — Bounded Pinch Compositing with Annotations

- Device feedback showed that compositing the complete multi-page document as one GPU
  layer could exceed iPad WebKit texture limits when page annotation canvases were
  active, causing the PDF layer to disappear during a finger pinch.
- Pinch preview now selects only the visible and immediately adjacent pages, capped at
  eight, and applies the same global focal-point matrix to each page independently.
  This preserves spread spacing and annotation alignment without allocating one
  document-length texture.
- Preview transforms, transform origins, and temporary stacking layers are explicitly
  cleared before the single final layout/render commit.
