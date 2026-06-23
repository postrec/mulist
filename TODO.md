# TODO.md

## Environment

- [ ] Make Homebrew Node.js 22.23.0 the default shell runtime. It is installed and was
      used for verification, but `/usr/local/bin/node` may still resolve to 20.16.0 in
      existing terminal sessions.
- [x] Install declared dependencies, synchronize `package-lock.json`, and verify real
      native types, ESLint, and Prettier. Completed during Firebase client setup.
- [ ] Run the v4 SQLite migration on an iPad simulator or device after dependencies
      are installed; only static verification was possible in the current environment.

## Product Decisions Needed Later

- [x] Store copied PDFs at
      `documentDirectory/song-packages/<songId>/score_01.pdf` and persist that local URI on
      Score. Decided during PDF Import implementation.
- [x] Use normalized pressure points, tool/color/width/opacity metadata, and separate
      normalized text notes for annotation persistence.
- [x] Use a dedicated `last_opened_at` timestamp for Recent Songs. Implemented in
      database migration v4.
- [ ] Connect and validate an on-device OCR recognizer that accepts PDF page images and
      supports Korean, English, and Japanese. The persistent OCR pipeline, background
      worker, retries, storage, search indexing, and largest-block image-title update are
      implemented, but Expo Go's bundled Managed modules do not provide this recognition
      engine.
- [ ] After choosing an Expo Development Build OCR engine, return bounding text blocks
      with height values so gallery imports can reliably choose the visually largest
      title instead of the text-only first-line fallback.
- [ ] Verify the new page-anchored annotation canvases, Pencil scroll suppression, and
      stabilized focal-point-preserving pinch zoom with real multi-page PDFs on the target iPad.
      Legacy version 1 strokes have no page identity and intentionally fall back to
      page 1; new version 2 strokes persist their page number.
- [ ] Device-test GPU preview pinch zoom in all four navigation modes and both page
      layouts, paying particular attention to the final commit at the 25% and 250%
      limits, centroids located in the gap between a two-page spread, and drawing mode
      with annotation canvases visible.
- [ ] Tune the default Apple Pencil smoothing value after comparing levels 0, 2, 5,
      and 10 with real handwriting on the target iPad. The current default is 2.
- [x] Keep Song tag editing limited to the fixed preset catalog. The temporary custom
      tag editor was removed, and CCM/교회음악/교회 now resolve to canonical `ccm`.

## Firebase Setup

- [x] Create Firebase project `mulist-sionuu` and register the iOS app with bundle
      identifier `com.mulist.app`.
- [ ] Choose the Firestore and Storage region before creating production resources.
- [ ] Enable Google and Apple authentication providers, create the Google Web OAuth
      client ID, and complete Apple Developer configuration. The app adapters are ready.
- [x] Implement and emulator-compile owner/team-scoped Firestore and Storage rules.
- [ ] Reauthenticate Firebase CLI and deploy rules, Hosting, and Functions. The latest
      2026-06-23 rules deployment was blocked because the CLI credentials expired again;
      until rules are deployed, production sync returns `missing or insufficient permissions`.
- [ ] Register the iOS development build with Firebase App Check (App Attest plus debug
      provider for development), add its native configuration, then enable enforcement.
- [ ] After App Check is configured, change the temporary `enforceAppCheck: false` on
      sharing, friend, setlist-user, and redeem callables to `true` before production.
- [ ] Deploy the new friend, setlist-user, sharing, and security-rule changes before
      testing Social or collaborator invitations against production Firebase.
- [ ] Confirm the Firebase project is on Blaze before deploying scheduled/callable
      Functions, and configure billing budget alerts.
- [ ] Decide whether StoreKit is integrated directly or through RevenueCat.

## Settings Dependencies

- [ ] Deploy `redeemSubscriptionCode`, create the first code with
      `cd functions && npm run redeem:generate`, and add the printed hashed document to
      Firestore. Keep plaintext codes outside Firestore.

- [ ] Configure StoreKit or RevenueCat product identifiers, purchase restoration, and
      the App Store subscription management URL before enabling payment actions.
- [ ] Connect the implemented Sync Queue/Sync Log schema to Force Sync and Sync Log
      actions in Developer Mode.
- [ ] Publish Terms of Service and Privacy Policy URLs before enabling Legal links.
- [ ] Choose a public support email address; Feedback currently opens a prefilled mail
      draft without a recipient.
- [ ] Apply the saved font-size preference across existing feature screens.
- [ ] Connect Auto Crop Margin to the PDF.js renderer. Default Zoom is now applied by
      the PDF.js page layout.
- [ ] Extend account deletion to remove Firestore and Storage user data after Cloud
      Sync is implemented.

## PDF Viewer Device Verification

- [x] Verify `TwoPageRight` on the target 11-inch iPad. iOS WebKit ignored it, so it
      was replaced with two side-by-side PDF page views.
- [x] Remove the temporary side-by-side WebViews. They did not satisfy the requirement
      for a single document renderer.
- [ ] Verify the new offline PDF.js viewer, single-renderer two-page layout, 25%
      full-page zoom-out, and live pinch percentage on the target 11-inch iPad.
- [ ] Measure PDF.js initial render time and memory use with large real-world Song
      Packages and tune the implemented visible-page ±2 buffer if rapid scrolling shows
      blank pages or the three-WebView Setlist cache exceeds the iPad memory target.
- [ ] Device-test Setlist cache promotion across at least five Songs and verify that
      the next two Songs open from their parsed first-page preload while the oldest of
      four candidates is actually released.
- [ ] Replace the temporary Base64 PDF transfer with a chunked binary bridge if large
      Song Packages cause memory pressure. Base64 was chosen for reliable Expo Go
      WKWebView loading after local file access stalled on the target iPad.
- [ ] Verify SQLite v6 viewer-state restoration, current-page tracking, horizontal
      swipe snapping, the floating drawing toolbar, and menu hiding on the target
      11-inch iPad.
- [ ] Verify that Expo Go's WKWebView reports Apple Pencil input as Pointer Event
      `pointerType: pen` on the target iPad. If that WebKit path is unavailable, move
      Pencil capture to a native PencilKit view in an Expo Development Build.

## Runtime Warnings

- [x] Add AsyncStorage-backed Firebase Auth persistence.
- [x] Replace React Native's deprecated `SafeAreaView` usages with
      `react-native-safe-area-context` and wrap the app in `SafeAreaProvider`.
