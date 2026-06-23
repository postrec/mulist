# TASKS.md

# Project Setup

- [x] Create Expo Project
- [x] Configure TypeScript
- [x] Configure ESLint
- [x] Configure Prettier

# Core Models

- [x] Song Entity
- [x] Score Entity
- [x] Setlist Entity
- [x] SetlistSong Entity

# Local Storage

- [x] SQLite Setup
- [x] Song Repository
- [x] Score Repository
- [x] Setlist Repository

# Library

- [x] Song List Screen
- [x] Compact Library Filter Row
- [x] MuList Home Branding
- [x] iPad Portrait Two-Column Library
- [x] Tag Presets and Alias IDs
- [x] Easy Tag Selection in Score Settings
- [x] Tag Alias Search
- [x] Library Header Count and Action Symbols
- [x] Library Card Action Icons
- [x] Stable Library Order on Favorite Change
- [x] Responsive Two-Column Library Refinement
- [x] Library Icon Size Refinement
- [x] Simplified Delete Icon and Larger Header Menu Type
- [x] Library Song Long-Press Actions
  - [x] Edit Song Metadata
  - [x] Sync Individual Song
  - [x] Destructive Delete Action
- [x] Unsynced Song Cloud Indicator
- [x] Recent Songs
- [x] Favorites
- [x] Tags
- [x] Trash

# Import

- [x] Single PDF Import
- [x] Batch PDF Import
- [x] Auto Title Detection
- [x] Duplicate Detection

# PDF Viewer

- [x] PDF Rendering
- [x] PDF.js Single-Document Rendering
  - [x] WKWebView Classic Script Compatibility
  - [x] Inline Engine and PDF Data Loading
  - [x] Blob Worker Bootstrap
  - [x] Classic Script Async Bootstrap
  - [x] Expo Go Fake Worker Fallback
- [x] Landscape Mode
- [x] Pencil Support
- [x] Pen Tool
- [x] Highlighter Tool
- [x] Eraser Tool
- [x] Text Tool
- [x] Portrait Mode Baseline
- [x] Zoom In/Out
  - [x] Pinch Zoom
  - [x] Full-Page Zoom Out
  - [x] Pinch Zoom Percentage Sync
- [x] Two-Page View
  - [x] Single-Renderer Spread Layout
- [x] Compact Viewer Menu Bar
- [x] Score Metadata Settings
  - [x] Manual Title
  - [x] Manual Artist
  - [x] Manual BPM
- [x] Persisted Viewer State
  - [x] Page Layout
  - [x] Current Page
  - [x] Scroll Mode
- [x] Collapsible Viewer Menu Bar
  - [x] Hide Button at Far Right
- [x] View Menu
  - [x] One/Two-Page Selection
  - [x] Scroll/Swipe Selection
  - [x] Anchored Popup and Outside-Tap Dismiss
  - [x] Page-Snapped Horizontal Swipe
  - [x] Single-Page Swipe Pager UX
  - [x] Discrete One-Page Swipe Rendering
  - [x] Discrete Two-Page Spread Swipe Rendering
  - [x] Two-Page Horizontal 40/40 Width with 10/10 Margins
  - [x] Two-Page Spread Inner Page Gap
  - [x] Animated Swipe Page Transition
  - [x] Finger-Tracked Interactive Swipe
  - [x] Adjacent Page Swipe Preview
  - [x] Scroll Snap Navigation Mode
  - [x] Separate Vertical/Horizontal Scroll and Snap Modes
- [x] Drawing Menu and Floating Toolbar
- [x] Remove Count In

# OCR

- [x] OCR Pipeline
- [x] Background Processing
- [x] Search Index

# Search

- [x] Title Search
- [x] Artist Search
- [x] Tag Search
- [x] OCR Search

# Setlists

- [x] Create
- [x] Update
- [x] Delete
- [x] Reorder
- [x] PDF Export
- [x] Split-Pane Setlist Score Preview
  - [x] Empty Preview Before Song Selection
  - [x] Single-Page Inline PDF Viewer
  - [x] Expanded Right Viewer Pane
  - [x] Open Full Viewer Action
- [x] Viewer Setlist Quick Navigation

# Music Features

- [x] BPM Storage
- [x] Metronome
- [x] Count In

# Cloud

## Firebase Setup

- [x] Create Firebase Project
- [x] Register iOS App
- [x] Add Firebase Client Configuration
- [x] Configure Firebase Emulator

## Authentication

- [x] Firebase Auth Setup
- [x] Email and Password Sign-Up
- [x] Email and Password Sign-In
- [ ] Google Sign-In
- [ ] Sign in with Apple
- [x] Auth Session Persistence
- [x] Sign Out

## Security

- [x] Firestore Security Rules
- [x] Storage Security Rules
- [ ] Firebase App Check

## Sync Foundation

- [x] Add Cloud Fields to Domain Models
- [x] SQLite Sync Schema Migration
- [x] Sync Queue Repository
- [x] Connectivity-Aware Sync Worker
- [x] Retry and Failure Recovery

## Song Package Sync

- [x] Firestore Song Metadata Mapping
- [x] Firebase Storage Package Upload
- [x] Firebase Storage Package Download
- [x] Annotation and OCR Sidecar Sync
- [x] Last Write Wins Conflict Resolution
- [x] Deletion Tombstone Sync
- [x] Automatic Backup and Restore

## Sharing

- [x] Create Three-Day Share Function
- [x] Generate Share Link
- [x] Validate Share Expiration
- [x] Import Shared Song Package
- [x] Cleanup Expired Shares

## Teams

- [x] Team Entity and Repository
- [x] Create and Update Team
- [x] Invite Team Member
- [x] Team Role Permissions
- [x] Team Library Access Rules

# Subscription

- [ ] Free Plan
- [ ] Premium Plan

# Future

- [ ] MusicXML
- [ ] Chord Detection
- [ ] Transpose

# 2026-06-23 UX and Collaboration

## Performance Viewer

- [x] Compact Setlist Quick Panel
- [x] Full-Width Viewer Menu Utilization
- [x] Apple Pencil Input Refinement
- [x] Pencil-Only Drawing with Simultaneous Finger Navigation
- [x] Disable Apple Pencil Scrolling while Drawing
- [x] Page-Anchored Annotation Overlay with Zoom Scaling
- [x] Font Awesome Drawing Tool Icons
- [x] Pinch Zoom Focal-Point Preservation
- [x] Pinch Zoom Value Stabilization
- [x] GPU Preview Pinch Zoom with Single Commit Rendering
- [x] Configurable Apple Pencil Curve Smoothing (0–10)
- [x] Pen and Highlighter Color Palette
- [x] Fixed Viewer Menu Bar without Horizontal Scrolling
- [x] Hidden-Menu Page Tap Snap
- [x] Hidden-Menu Margin Tap Reveal

## Shared Screen Headers

- [x] Unified 48px Header Height Outside Library
- [x] Transparent Safe-Area Background Extension
- [x] Migrate Screens to react-native-safe-area-context

## Setlist Editing

- [x] Explicit Setlist Edit Mode
- [x] Rename in Edit Mode
- [x] Reorder Arrows Only in Edit Mode
- [x] Drag-and-Drop Song Reordering
- [x] Search Library Songs to Add
- [x] Setlist User Management Screen

## Social

- [x] Friend Entity and Repository
- [x] Friend Search and Requests
- [x] Social Home Screen
- [x] Library Header Social Navigation
- [x] Rename Visible Social Navigation to Friends
- [x] Remove Direct Song-Card Delete Action

## Sharing

- [x] Library Long-Press Share Action
- [x] Three-Day Firebase Share Sheet
- [ ] Target User Share Delivery
- [x] Exclude Favorite State from Shared Data
- [x] Auto-Sync Unsynced Song Before Sharing

## Library Sync Status

- [x] Outline Cloud Icon

# Settings

## Settings Screen

- [x] Settings 화면 생성
- [x] 홈 화면에서 Settings 진입 버튼 추가
- [x] Settings Navigation 구성

---

## Display Settings

- [x] Display Settings 화면 생성
- [x] Theme 설정
  - [x] Light
  - [x] Dark
  - [x] System

- [x] Font Size 설정
  - [x] Small
  - [x] Medium
  - [x] Large

- [x] 기본 보기 모드 설정
  - [x] 1쪽 / 2쪽
  - [x] 스크롤 / 스냅(상하) / 스크롤(좌우)

- [x] PDF View Settings
  - [x] Auto Crop Margin
  - [x] Default Zoom
  - [x] Landscape Lock

---

## Account Settings

- [x] Account 화면 생성
- [x] Settings Home Account Summary
- [x] 로그인 정보 표시
- [x] Profile Color Selection
- [x] Profile Name and Bio
- [x] Primary Musician Part
- [x] 로그아웃
- [x] 계정 삭제

---

## Subscription Settings

- [x] Subscription 화면 생성
- [x] 현재 플랜 표시
- [x] Free/Premium 상태 표시
- [x] MuList Redeem Code Implementation
- [ ] Deploy MuList Redeem Function and Create First Code
- [ ] 구독 시작
- [ ] 구독 복원
- [ ] 결제 관리 링크

---

## Developer Mode

- [x] Developer Mode 토글
- [x] Developer Mode 화면 생성

### OCR

- [x] OCR 강제 재실행
- [x] OCR 결과 보기

### Database

- [x] Song Count 보기
- [x] Database 정보 보기
- [x] Database 초기화

### Storage

- [x] Song Package 보기
- [x] Storage 사용량 보기

### Sync

- [x] Sync 상태 보기
- [ ] 강제 동기화 실행
- [ ] Sync 로그 보기

### Debug

- [x] 테스트 Song 생성
- [x] 테스트 Setlist 생성

---

## Feedback

- [x] Feedback 화면 생성
- [x] 버그 제보
- [x] 기능 제안
- [x] 문의하기

### Diagnostic Data

- [x] App Version 포함
- [x] Device Model 포함
- [x] OS Version 포함

---

## Version Information

- [x] App Version 표시
- [x] Build Number 표시
- [x] Release Notes
- [x] Open Source Licenses
- [ ] Terms of Service
- [ ] Privacy Policy

---

## Persistence

- [x] Settings Local Storage
- [x] Cloud Sync Settings
