# MuList Web Client

iPad 앱과 같은 Firebase 프로젝트를 사용하는 Next.js App Router 기반 웹 클라이언트입니다. 모든 코드는 이 폴더 안에만 있습니다.

## 실행

1. Firebase Console에서 Web App을 등록합니다.
2. `.env.local.example`을 `.env.local`로 복사하고 Web App 값을 입력합니다.
3. `npm install`
4. `npm run dev`

개발 Emulator를 쓰려면 `.env.local`의 `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`로 설정합니다.

## Song Package v2

Firestore 검색 메타데이터:

```text
users/{uid}/songs/{songId}
users/{uid}/setlists/{setlistId}
```

Firebase Storage 패키지:

```text
users/{uid}/songs/{songId}/
├── metadata.json
├── {scoreId}.pdf
└── {scoreId}.sidecar.json
```

PDF, sidecar, manifest 업로드가 모두 성공한 뒤 Firestore 문서를 기록합니다. iPad 리스너는 완성된 Song만 관찰합니다. 수정과 삭제는 `revision`, `updatedAt`, `deletedAt` tombstone을 사용합니다.

## 구현 범위

- Email 회원가입, 로그인, 로그아웃
- Firestore `onSnapshot` 실시간 Library/Setlist 구독
- PDF 다중 업로드, PDF 형식 및 파일당 50MB 검증
- 공개 Google Drive PDF 링크 가져오기 (`/file/d`, `open?id`, `uc?id` 지원)
- PDF마다 Song과 iPad 호환 Song Package 자동 생성
- 곡 제목, 아티스트, BPM, 태그, 즐겨찾기 편집
- PDF 열기 및 Song tombstone 삭제
- 셋리스트 생성, 곡 선택, tombstone 삭제
- `/api/health` Next.js API Route
