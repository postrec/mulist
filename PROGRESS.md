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
