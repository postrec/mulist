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
      worker, retries, storage, and search indexing are implemented, but Expo SDK 56's
      bundled Managed modules do not provide this recognition engine.
- [ ] Verify page-anchored annotation coordinates with real multi-page PDFs. The
      current native WebView overlay stores viewport-normalized points; a page-aware PDF
      renderer may be required if annotations drift after PDF scrolling.

## Firebase Setup

- [x] Create Firebase project `mulist-sionuu` and register the iOS app with bundle
      identifier `com.mulist.app`.
- [ ] Choose the Firestore and Storage region before creating production resources.
- [ ] Enable Google and Apple authentication providers and complete the Apple Developer
      configuration.
- [ ] Configure Firestore Rules, Storage Rules, App Check, billing budget alerts, and
      local Firebase Emulator coverage before production data is uploaded.
- [ ] Decide whether StoreKit is integrated directly or through RevenueCat.

## Settings Dependencies

- [ ] Configure StoreKit or RevenueCat product identifiers, purchase restoration, and
      the App Store subscription management URL before enabling payment actions.
- [ ] Implement Sync Queue and Sync Log persistence before enabling Force Sync and
      Sync Log actions in Developer Mode.
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
      Packages; add visible-page lazy rendering if long scores exceed the MVP target.
- [ ] Replace the temporary Base64 PDF transfer with a chunked binary bridge if large
      Song Packages cause memory pressure. Base64 was chosen for reliable Expo Go
      WKWebView loading after local file access stalled on the target iPad.

## Runtime Warnings

- [ ] Add AsyncStorage-backed Firebase Auth persistence when implementing the existing
      Auth Session Persistence task. Auth currently uses memory persistence only.
- [ ] Replace React Native's deprecated `SafeAreaView` usages with
      `react-native-safe-area-context` in a dedicated compatibility pass.
