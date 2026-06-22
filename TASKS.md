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

- [ ] Firebase Auth Setup
- [ ] Google Sign-In
- [ ] Sign in with Apple
- [ ] Auth Session Persistence
- [ ] Sign Out

## Security

- [ ] Firestore Security Rules
- [ ] Storage Security Rules
- [ ] Firebase App Check

## Sync Foundation

- [ ] Add Cloud Fields to Domain Models
- [ ] SQLite Sync Schema Migration
- [ ] Sync Queue Repository
- [ ] Connectivity-Aware Sync Worke~r
- [ ] Retry and Failure Recovery

## Song Package Sync

- [ ] Firestore Song Metadata Mapping
- [ ] Firebase Storage Package Upload
- [ ] Firebase Storage Package Download
- [ ] Annotation and OCR Sidecar Sync
- [ ] Last Write Wins Conflict Resolution
- [ ] Deletion Tombstone Sync
- [ ] Automatic Backup and Restore

## Sharing

- [ ] Create Three-Day Share Function
- [ ] Generate Share Link
- [ ] Validate Share Expiration
- [ ] Import Shared Song Package
- [ ] Cleanup Expired Shares

## Teams

- [ ] Team Entity and Repository
- [ ] Create and Update Team
- [ ] Invite Team Member
- [ ] Team Role Permissions
- [ ] Team Library Access Rules

# Subscription

- [ ] Free Plan
- [ ] Premium Plan

# Future

- [ ] MusicXML
- [ ] Chord Detection
- [ ] Transpose

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

- [x] PDF View Settings
  - [x] Auto Crop Margin
  - [x] Default Zoom
  - [x] Landscape Lock

---

## Account Settings

- [x] Account 화면 생성
- [x] 로그인 정보 표시
- [x] 로그아웃
- [x] 계정 삭제

---

## Subscription Settings

- [x] Subscription 화면 생성
- [x] 현재 플랜 표시
- [x] Free/Premium 상태 표시
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
