import { languageNames, type AppLanguage } from './language';

type TranslationKey =
  | 'common.backToLibrary'
  | 'common.backToSettings'
  | 'common.cancel'
  | 'common.delete'
  | 'common.confirm'
  | 'common.loading'
  | 'common.none'
  | 'account.appleLogin'
  | 'account.cloudNotice'
  | 'account.deleteAccount'
  | 'account.deleteConfirmBody'
  | 'account.deleteConfirmTitle'
  | 'account.email'
  | 'account.emailPlaceholder'
  | 'account.emailStart'
  | 'account.firebaseUid'
  | 'account.googleLogin'
  | 'account.login'
  | 'account.loginMethod'
  | 'account.logout'
  | 'account.notSignedIn'
  | 'account.passwordPlaceholder'
  | 'account.register'
  | 'account.signInWithEmail'
  | 'account.title'
  | 'display.autoCropDescription'
  | 'display.defaultNavigationMode'
  | 'display.defaultNavigationModeDescription'
  | 'display.defaultPageLayout'
  | 'display.defaultPageLayoutDescription'
  | 'display.defaultZoom'
  | 'display.defaultZoomDescription'
  | 'display.fontSize'
  | 'display.fontSizeDescription'
  | 'display.fontLarge'
  | 'display.fontMedium'
  | 'display.fontSmall'
  | 'display.landscapeLock'
  | 'display.landscapeLockDescription'
  | 'display.pencilSmoothing'
  | 'display.pencilSmoothingDescription'
  | 'display.themeDark'
  | 'display.themeLight'
  | 'display.themeSystem'
  | 'display.theme'
  | 'display.themeDescription'
  | 'developer.createTestSetlist'
  | 'developer.createTestSong'
  | 'developer.database'
  | 'developer.description'
  | 'developer.debug'
  | 'developer.loadingError'
  | 'developer.ocr'
  | 'developer.packageUsage'
  | 'developer.pdfPreviewScale'
  | 'developer.pdfPreviewScaleDescription'
  | 'developer.resetConfirmBody'
  | 'developer.resetConfirmTitle'
  | 'developer.resetDatabase'
  | 'developer.rerunOcr'
  | 'developer.stats'
  | 'developer.storage'
  | 'developer.sync'
  | 'developer.syncStatus'
  | 'developer.title'
  | 'developer.viewOcrResult'
  | 'feedback.bodyPrompt'
  | 'feedback.bugReport'
  | 'feedback.contact'
  | 'feedback.description'
  | 'feedback.diagnosticsTitle'
  | 'feedback.featureRequest'
  | 'feedback.intro'
  | 'feedback.title'
  | 'language.description'
  | 'language.english'
  | 'language.japanese'
  | 'language.korean'
  | 'language.title'
  | 'library.importPdf'
  | 'library.all'
  | 'library.emptyFavoritesDescription'
  | 'library.emptyFavoritesTitle'
  | 'library.emptyFirstDescription'
  | 'library.emptyFirstTitle'
  | 'library.emptyRecentDescription'
  | 'library.emptyRecentTitle'
  | 'library.emptyTagsDescription'
  | 'library.emptyTagsTitle'
  | 'library.emptyTrashDescription'
  | 'library.emptyTrashTitle'
  | 'library.editSong'
  | 'library.favorites'
  | 'library.friend'
  | 'library.latest'
  | 'library.recent'
  | 'library.search'
  | 'library.setlists'
  | 'library.settings'
  | 'library.title'
  | 'library.tags'
  | 'library.trash'
  | 'logs.clear'
  | 'logs.empty'
  | 'logs.loading'
  | 'logs.recent'
  | 'logs.refresh'
  | 'profile.bio'
  | 'profile.bioPlaceholder'
  | 'profile.cloudSaved'
  | 'profile.color'
  | 'profile.localSaved'
  | 'profile.name'
  | 'profile.namePlaceholder'
  | 'profile.part'
  | 'profile.save'
  | 'profile.saving'
  | 'profile.title'
  | 'score.artist'
  | 'score.bpmUnset'
  | 'score.cancel'
  | 'score.save'
  | 'score.saving'
  | 'score.settings'
  | 'score.tags'
  | 'score.title'
  | 'score.titleRequired'
  | 'score.bpmInvalid'
  | 'search.all'
  | 'search.artist'
  | 'search.emptyQuery'
  | 'search.emptyResults'
  | 'search.ocr'
  | 'search.placeholder'
  | 'search.tag'
  | 'search.title'
  | 'search.titleScope'
  | 'setlists.addFromLibrary'
  | 'setlists.create'
  | 'setlists.createPrompt'
  | 'setlists.deleteTitle'
  | 'setlists.deleteConfirm'
  | 'setlists.editDate'
  | 'setlists.editEventName'
  | 'setlists.editName'
  | 'setlists.empty'
  | 'setlists.renameDatePrompt'
  | 'setlists.selectedEmpty'
  | 'setlists.order'
  | 'setlists.title'
  | 'settings.account'
  | 'settings.accountSubtitle'
  | 'settings.appSettings'
  | 'settings.allLogs'
  | 'settings.allLogsView'
  | 'settings.autoCropMargin'
  | 'settings.cloudSync'
  | 'settings.cloudAutoDescription'
  | 'settings.cloudForceSync'
  | 'settings.cloudForceSyncing'
  | 'settings.cloudLogs'
  | 'settings.cloudWifiOnly'
  | 'settings.cloudWifiOnlyDescription'
  | 'settings.developerMode'
  | 'settings.displaySettings'
  | 'settings.displaySubtitle'
  | 'settings.defaultNavigationMode'
  | 'settings.defaultPageLayout'
  | 'settings.defaultZoom'
  | 'settings.feedback'
  | 'settings.feedbackSubtitle'
  | 'settings.fontSize'
  | 'settings.homeSectionApp'
  | 'settings.homeSectionSupport'
  | 'settings.language'
  | 'settings.languageDescription'
  | 'settings.languageTitle'
  | 'settings.languageValueEn'
  | 'settings.languageValueJa'
  | 'settings.languageValueKo'
  | 'settings.languageValueLabel'
  | 'settings.subscription'
  | 'settings.subscriptionSubtitle'
  | 'settings.sync'
  | 'settings.syncSubtitle'
  | 'settings.landscapeLock'
  | 'settings.theme'
  | 'settings.title'
  | 'settings.versionInfo'
  | 'settings.versionSubtitle'
  | 'subscription.currentPlan'
  | 'subscription.freePlan'
  | 'subscription.manageBilling'
  | 'subscription.premiumPlan'
  | 'subscription.redeem'
  | 'subscription.redeemDescription'
  | 'subscription.redeemInvalid'
  | 'subscription.redeemPlaceholder'
  | 'subscription.redeemRateLimited'
  | 'subscription.redeemSignInRequired'
  | 'subscription.redeemSuccess'
  | 'subscription.redeemTitle'
  | 'subscription.restorePurchases'
  | 'subscription.startSubscription'
  | 'subscription.title'
  | 'subscription.unavailable'
  | 'version.build'
  | 'version.legal'
  | 'version.openSourceLicenses'
  | 'version.releaseNotes'
  | 'version.title'
  | 'version.unavailable'
  | 'viewer.drawing'
  | 'viewer.eraser'
  | 'viewer.highlighter'
  | 'viewer.hideMenu'
  | 'viewer.menu'
  | 'viewer.navigationMode'
  | 'viewer.pageView'
  | 'viewer.pen'
  | 'viewer.scoreSettings'
  | 'viewer.scroll'
  | 'viewer.scrollHorizontal'
  | 'viewer.snapHorizontal'
  | 'viewer.setlist'
  | 'viewer.singlePage'
  | 'viewer.snapVertical'
  | 'viewer.title'
  | 'viewer.twoPage'
  | 'viewer.view'
  | 'viewer.zoomIn'
  | 'viewer.zoomOut';

const dictionaries: Record<AppLanguage, Record<TranslationKey, string>> = {
  ko: {
    'common.backToLibrary': '‹ 라이브러리',
    'common.backToSettings': '‹ 설정',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.confirm': '확인',
    'common.loading': '처리 중…',
    'common.none': '-',
    'account.appleLogin': 'Apple로 로그인',
    'account.cloudNotice': 'Cloud 기능은 로그인 후 사용할 수 있습니다.',
    'account.deleteAccount': '계정 삭제',
    'account.deleteConfirmBody':
      'Firebase 계정을 영구 삭제합니다. 최근 로그인이 필요할 수 있습니다.',
    'account.deleteConfirmTitle': '계정 삭제',
    'account.email': '이메일',
    'account.emailPlaceholder': 'email@example.com',
    'account.emailStart': '이메일로 시작하기',
    'account.firebaseUid': 'Firebase UID',
    'account.googleLogin': 'Google로 로그인',
    'account.login': '로그인',
    'account.loginMethod': '로그인 방식',
    'account.logout': '로그아웃',
    'account.notSignedIn': '로그인하지 않음',
    'account.passwordPlaceholder': '비밀번호 (6자 이상)',
    'account.register': '회원가입',
    'account.signInWithEmail': '이메일로 시작하기',
    'account.title': '계정',
    'display.autoCropDescription':
      '악보 가장자리의 빈 여백을 자동으로 줄입니다.',
    'display.defaultNavigationMode': 'Default Navigation Mode',
    'display.defaultNavigationModeDescription':
      '악보를 넘길 때 사용할 기본 이동 방식을 선택합니다.',
    'display.defaultPageLayout': 'Default Page Layout',
    'display.defaultPageLayoutDescription':
      '악보를 처음 열 때 사용할 기본 페이지 보기 방식입니다.',
    'display.defaultZoom': 'Default Zoom',
    'display.defaultZoomDescription':
      'PDF를 열 때 적용할 기본 확대 비율입니다.',
    'display.fontSize': 'Font Size',
    'display.fontSizeDescription':
      '목록과 설정 화면에서 사용할 글자 크기입니다.',
    'display.fontLarge': 'Large',
    'display.fontMedium': 'Medium',
    'display.fontSmall': 'Small',
    'display.landscapeLock': 'Landscape Lock',
    'display.landscapeLockDescription':
      'PDF Viewer를 가로 방향으로 고정합니다.',
    'display.pencilSmoothing': 'Apple Pencil 곡선 보정',
    'display.pencilSmoothingDescription':
      '0은 보정 없음, 10은 가장 강한 곡선 보정입니다.',
    'display.themeDark': 'Dark',
    'display.themeLight': 'Light',
    'display.themeSystem': 'System',
    'display.theme': 'Theme',
    'display.themeDescription': '앱의 기본 색상 모드를 선택합니다.',
    'developer.createTestSetlist': '테스트 Setlist 생성',
    'developer.createTestSong': '테스트 Song 생성',
    'developer.database': 'Database',
    'developer.description': '진단 및 테스트 도구를 표시합니다.',
    'developer.debug': 'Debug',
    'developer.loadingError': '작업에 실패했습니다.',
    'developer.ocr': 'OCR',
    'developer.packageUsage': 'Song Package / 사용량 보기',
    'developer.pdfPreviewScale': 'PDF 저해상도 미리보기 품질',
    'developer.pdfPreviewScaleDescription':
      '우선 렌더 범위 밖 페이지에 사용할 해상도입니다. 높을수록 선명하지만 메모리와 렌더 시간이 증가합니다.',
    'developer.resetConfirmBody': '모든 Song과 Setlist를 삭제합니다.',
    'developer.resetConfirmTitle': 'Database 초기화',
    'developer.resetDatabase': 'Database 초기화',
    'developer.rerunOcr': 'OCR 강제 재실행',
    'developer.stats': 'Song Count / Database 정보',
    'developer.storage': 'Storage',
    'developer.sync': 'Sync',
    'developer.syncStatus': 'Sync 상태: Sync Queue 미구성',
    'developer.title': 'Developer Mode',
    'developer.viewOcrResult': 'OCR 결과 보기',
    'feedback.bodyPrompt': '내용을 입력해 주세요.',
    'feedback.bugReport': '버그 제보',
    'feedback.contact': '문의하기',
    'feedback.description': '오류 상황과 재현 방법을 알려주세요.',
    'feedback.diagnosticsTitle': '포함되는 진단 정보',
    'feedback.featureRequest': '기능 제안',
    'feedback.intro':
      '메일 앱을 열어 의견을 보냅니다. 문제 해결을 위해 앱과 기기 정보가 자동 포함됩니다.',
    'feedback.title': '피드백',
    'language.description':
      '앱 전체 메뉴와 기능 텍스트를 표시할 언어를 선택합니다.',
    'language.english': '영어',
    'language.japanese': '일본어',
    'language.korean': '한국어',
    'language.title': '언어',
    'library.all': '전체',
    'library.emptyFavoritesDescription': '자주 쓰는 곡에 별표를 추가해 보세요.',
    'library.emptyFavoritesTitle': '즐겨찾기가 없습니다',
    'library.emptyFirstDescription':
      'PDF 악보를 가져오면 곡 중심으로 정리할 수 있어요.',
    'library.emptyFirstTitle': '첫 곡을 추가해 보세요',
    'library.emptyRecentDescription': '곡을 열면 여기에 표시됩니다.',
    'library.emptyRecentTitle': '최근 사용한 곡이 없습니다',
    'library.emptyTagsDescription':
      '곡에 태그를 추가하거나 다른 태그를 선택하세요.',
    'library.emptyTagsTitle': '선택한 태그의 곡이 없습니다',
    'library.emptyTrashDescription': '삭제한 곡은 30일 동안 보관됩니다.',
    'library.emptyTrashTitle': '휴지통이 비어 있습니다',
    'library.editSong': '곡 정보 수정',
    'library.favorites': '즐겨찾기',
    'library.friend': '친구',
    'library.importPdf': '＋ PDF 가져오기',
    'library.latest': '라이브러리가 최신 상태입니다.',
    'library.recent': '최근',
    'library.search': '검색',
    'library.setlists': '셋리스트',
    'library.settings': '설정',
    'library.title': '라이브러리',
    'library.tags': '태그',
    'library.trash': '휴지통',
    'logs.clear': '모두 지우기',
    'logs.empty': '저장된 로그가 없습니다.',
    'logs.loading': '불러오는 중…',
    'logs.recent': '최근 로그',
    'logs.refresh': '새로고침',
    'profile.bio': '자기소개',
    'profile.bioPlaceholder': '연주 활동이나 관심사를 간단히 소개해 주세요.',
    'profile.cloudSaved': '프로필을 저장했습니다.',
    'profile.color': '프로필 색상',
    'profile.localSaved':
      '기기에 저장했습니다. Cloud 연결 시 다시 동기화해 주세요.',
    'profile.name': '이름',
    'profile.namePlaceholder': '표시할 이름',
    'profile.part': '주 파트',
    'profile.save': '프로필 저장',
    'profile.saving': '저장 중…',
    'profile.title': '프로필',
    'score.artist': '가수',
    'score.bpmInvalid': 'BPM은 30~300 사이로 입력해주세요.',
    'score.bpmUnset': '미설정',
    'score.cancel': '취소',
    'score.save': '저장',
    'score.saving': '저장 중…',
    'score.settings': '악보 설정',
    'score.tags': '태그',
    'score.title': '제목',
    'score.titleRequired': '제목을 입력해주세요.',
    'search.all': '전체',
    'search.artist': '아티스트',
    'search.emptyQuery': '검색어를 입력하세요.',
    'search.emptyResults': '검색 결과가 없습니다.',
    'search.ocr': 'OCR',
    'search.placeholder': '곡, 아티스트, 태그, 악보 내용 검색',
    'search.tag': '태그',
    'search.title': '검색',
    'search.titleScope': '제목',
    'setlists.addFromLibrary': '라이브러리에서 추가',
    'setlists.create': '새 셋리스트',
    'setlists.createPrompt': '셋리스트 이름을 입력하세요.',
    'setlists.deleteTitle': '셋리스트 삭제',
    'setlists.deleteConfirm': '이 셋리스트를 삭제할까요?',
    'setlists.editDate': '날짜 수정',
    'setlists.editEventName': '행사명 수정',
    'setlists.editName': '이름 수정',
    'setlists.empty': '셋리스트가 없습니다.',
    'setlists.renameDatePrompt': 'YYYY-MM-DD',
    'setlists.selectedEmpty': '셋리스트를 선택하거나 새로 만드세요.',
    'setlists.order': '곡 순서',
    'setlists.title': '셋리스트',
    'settings.account': '계정',
    'settings.accountSubtitle': '로그인과 계정 관리',
    'settings.appSettings': '앱 설정',
    'settings.allLogs': '모든 로그',
    'settings.allLogsView': '모든 로그 보기',
    'settings.autoCropMargin': 'Auto Crop Margin',
    'settings.cloudSync': '클라우드 동기화',
    'settings.cloudAutoDescription':
      '로그인 상태에서 앱 시작·복귀·네트워크 재연결 시 자동으로 동기화됩니다.',
    'settings.cloudForceSync': '지금 모든 곡 데이터 동기화',
    'settings.cloudForceSyncing': '모든 곡 동기화 중…',
    'settings.cloudLogs': '동기화 로그',
    'settings.cloudWifiOnly': 'Wi-Fi에서만 동기화',
    'settings.cloudWifiOnlyDescription':
      '대용량 PDF 업로드는 Wi-Fi 연결에서만 실행합니다.',
    'settings.developerMode': 'Developer Mode',
    'settings.displaySettings': '화면 설정',
    'settings.displaySubtitle': '테마, 글자 크기, PDF 보기',
    'settings.defaultNavigationMode': 'Default Navigation Mode',
    'settings.defaultPageLayout': 'Default Page Layout',
    'settings.defaultZoom': 'Default Zoom',
    'settings.feedback': '피드백',
    'settings.feedbackSubtitle': '버그 제보, 기능 제안, 문의',
    'settings.fontSize': 'Font Size',
    'settings.homeSectionApp': '앱 설정',
    'settings.homeSectionSupport': '지원',
    'settings.language': '언어',
    'settings.languageDescription': '메뉴와 기능 텍스트 언어',
    'settings.languageTitle': '언어 설정',
    'settings.languageValueEn': '영어',
    'settings.languageValueJa': '일본어',
    'settings.languageValueKo': '한국어',
    'settings.languageValueLabel': '현재 언어',
    'settings.subscription': '구독',
    'settings.subscriptionSubtitle': '플랜과 결제 관리',
    'settings.sync': '클라우드 동기화',
    'settings.syncSubtitle': '백업과 네트워크 사용',
    'settings.landscapeLock': 'Landscape Lock',
    'settings.theme': 'Theme',
    'settings.title': '설정',
    'settings.versionInfo': '버전 정보',
    'settings.versionSubtitle': '앱 버전, 릴리스 노트, 라이선스',
    'subscription.currentPlan': '현재 플랜',
    'subscription.freePlan': 'Free',
    'subscription.manageBilling': '결제 관리 링크',
    'subscription.premiumPlan': 'Premium',
    'subscription.redeem': '리딤',
    'subscription.redeemDescription':
      'MuList 리딤 코드를 입력하면 Premium 권한이 계정에 적용됩니다.',
    'subscription.redeemInvalid': '유효하지 않거나 만료된 리딤 코드입니다.',
    'subscription.redeemPlaceholder': '리딤 코드 입력',
    'subscription.redeemRateLimited':
      '시도 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    'subscription.redeemSignInRequired':
      '리딤 코드를 사용하려면 먼저 로그인해 주세요.',
    'subscription.redeemSuccess': 'Premium이 활성화되었습니다.',
    'subscription.redeemTitle': '리딤 코드',
    'subscription.restorePurchases': '구독 복원',
    'subscription.startSubscription': '구독 시작',
    'subscription.title': '구독',
    'subscription.unavailable': '구독 기능은 아직 연결되지 않았습니다.',
    'version.build': 'Build',
    'version.legal': 'Legal',
    'version.openSourceLicenses': 'Open Source Licenses',
    'version.releaseNotes': 'Release Notes',
    'version.title': '버전 정보',
    'version.unavailable':
      'Terms of Service와 Privacy Policy는 공개 URL 확정 후 연결됩니다.',
    'viewer.drawing': '그리기',
    'viewer.eraser': '지우개',
    'viewer.highlighter': '형광펜',
    'viewer.hideMenu': '메뉴 숨기기',
    'viewer.menu': '메뉴',
    'viewer.navigationMode': '이동 방식',
    'viewer.pageView': '페이지 보기',
    'viewer.pen': '펜',
    'viewer.scoreSettings': '악보 설정',
    'viewer.scroll': '상하 스크롤',
    'viewer.scrollHorizontal': '좌우 스크롤',
    'viewer.snapHorizontal': '좌우 스냅',
    'viewer.setlist': '셋리스트',
    'viewer.singlePage': '1쪽',
    'viewer.snapVertical': '상하 스냅',
    'viewer.title': '악보 뷰어',
    'viewer.twoPage': '2쪽',
    'viewer.view': '보기',
    'viewer.zoomIn': '확대',
    'viewer.zoomOut': '축소',
  },
  en: {
    'common.backToLibrary': '‹ Library',
    'common.backToSettings': '‹ Settings',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.confirm': 'OK',
    'common.loading': 'Working…',
    'common.none': '-',
    'account.appleLogin': 'Sign in with Apple',
    'account.cloudNotice': 'Cloud features are available after sign-in.',
    'account.deleteAccount': 'Delete account',
    'account.deleteConfirmBody':
      'This will permanently delete your Firebase account. A recent sign-in may be required.',
    'account.deleteConfirmTitle': 'Delete account',
    'account.email': 'Email',
    'account.emailPlaceholder': 'email@example.com',
    'account.emailStart': 'Get started with email',
    'account.firebaseUid': 'Firebase UID',
    'account.googleLogin': 'Sign in with Google',
    'account.login': 'Sign in',
    'account.loginMethod': 'Sign-in method',
    'account.logout': 'Sign out',
    'account.notSignedIn': 'Not signed in',
    'account.passwordPlaceholder': 'Password (6+ characters)',
    'account.register': 'Sign up',
    'account.signInWithEmail': 'Get started with email',
    'account.title': 'Account',
    'display.autoCropDescription':
      'Automatically trim blank margins around scores.',
    'display.defaultNavigationMode': 'Default Navigation Mode',
    'display.defaultNavigationModeDescription':
      'Choose the default way to move through scores.',
    'display.defaultPageLayout': 'Default Page Layout',
    'display.defaultPageLayoutDescription':
      'Choose the default page layout when opening scores.',
    'display.defaultZoom': 'Default Zoom',
    'display.defaultZoomDescription':
      'Choose the default zoom level when opening PDFs.',
    'display.fontSize': 'Font Size',
    'display.fontSizeDescription':
      'Choose the text size used in lists and settings.',
    'display.fontLarge': 'Large',
    'display.fontMedium': 'Medium',
    'display.fontSmall': 'Small',
    'display.landscapeLock': 'Landscape Lock',
    'display.landscapeLockDescription':
      'Lock the PDF viewer to landscape orientation.',
    'display.pencilSmoothing': 'Apple Pencil Curve Smoothing',
    'display.pencilSmoothingDescription':
      '0 disables smoothing and 10 applies the strongest correction.',
    'display.themeDark': 'Dark',
    'display.themeLight': 'Light',
    'display.themeSystem': 'System',
    'display.theme': 'Theme',
    'display.themeDescription': 'Choose the app color mode.',
    'developer.createTestSetlist': 'Create Test Setlist',
    'developer.createTestSong': 'Create Test Song',
    'developer.database': 'Database',
    'developer.description': 'Shows diagnostics and test tools.',
    'developer.debug': 'Debug',
    'developer.loadingError': 'Operation failed.',
    'developer.ocr': 'OCR',
    'developer.packageUsage': 'Song Package / Storage Usage',
    'developer.pdfPreviewScale': 'PDF preview quality',
    'developer.pdfPreviewScaleDescription':
      'Resolution used for pages outside the priority render range. Higher values are sharper but use more memory and rendering time.',
    'developer.resetConfirmBody': 'This will delete all songs and setlists.',
    'developer.resetConfirmTitle': 'Reset Database',
    'developer.resetDatabase': 'Reset Database',
    'developer.rerunOcr': 'Force OCR rerun',
    'developer.stats': 'Song count / database info',
    'developer.storage': 'Storage',
    'developer.sync': 'Sync',
    'developer.syncStatus': 'Sync status: sync queue not configured',
    'developer.title': 'Developer Mode',
    'developer.viewOcrResult': 'View OCR results',
    'feedback.bodyPrompt': 'Please enter your message.',
    'feedback.bugReport': 'Report a bug',
    'feedback.contact': 'Contact us',
    'feedback.description': 'Tell us what happened and how to reproduce it.',
    'feedback.diagnosticsTitle': 'Included diagnostics',
    'feedback.featureRequest': 'Suggest a feature',
    'feedback.intro':
      'Opens your mail app to send feedback. App and device details are attached automatically for troubleshooting.',
    'feedback.title': 'Feedback',
    'language.description':
      'Choose the language used for all menus and feature text.',
    'language.english': 'English',
    'language.japanese': 'Japanese',
    'language.korean': 'Korean',
    'language.title': 'Language',
    'library.all': 'All',
    'library.emptyFavoritesDescription': 'Star songs you use often.',
    'library.emptyFavoritesTitle': 'No favorites yet',
    'library.emptyFirstDescription':
      'Import PDF scores to organize them by song.',
    'library.emptyFirstTitle': 'Add your first song',
    'library.emptyRecentDescription': 'Songs appear here after you open them.',
    'library.emptyRecentTitle': 'No recently opened songs',
    'library.emptyTagsDescription':
      'Add a tag to a song or select another tag.',
    'library.emptyTagsTitle': 'No songs with this tag',
    'library.emptyTrashDescription': 'Deleted songs are retained for 30 days.',
    'library.emptyTrashTitle': 'Trash is empty',
    'library.editSong': 'Edit song information',
    'library.favorites': 'Favorites',
    'library.friend': 'Friends',
    'library.importPdf': '＋ Import PDF',
    'library.latest': 'Library is up to date.',
    'library.recent': 'Recent',
    'library.search': 'Search',
    'library.setlists': 'Setlists',
    'library.settings': 'Settings',
    'library.title': 'Library',
    'library.tags': 'Tags',
    'library.trash': 'Trash',
    'logs.clear': 'Clear all',
    'logs.empty': 'No saved logs.',
    'logs.loading': 'Loading…',
    'logs.recent': 'Recent logs',
    'logs.refresh': 'Refresh',
    'profile.bio': 'Bio',
    'profile.bioPlaceholder':
      'Briefly describe your musical work or interests.',
    'profile.cloudSaved': 'Profile saved.',
    'profile.color': 'Profile color',
    'profile.localSaved':
      'Saved on this device. It will sync when Cloud is available.',
    'profile.name': 'Name',
    'profile.namePlaceholder': 'Display name',
    'profile.part': 'Primary role',
    'profile.save': 'Save profile',
    'profile.saving': 'Saving…',
    'profile.title': 'Profile',
    'score.artist': 'Artist',
    'score.bpmInvalid': 'BPM must be between 30 and 300.',
    'score.bpmUnset': 'Not set',
    'score.cancel': 'Cancel',
    'score.save': 'Save',
    'score.saving': 'Saving…',
    'score.settings': 'Score settings',
    'score.tags': 'Tags',
    'score.title': 'Title',
    'score.titleRequired': 'Enter a title.',
    'search.all': 'All',
    'search.artist': 'Artist',
    'search.emptyQuery': 'Enter a search term.',
    'search.emptyResults': 'No results found.',
    'search.ocr': 'OCR',
    'search.placeholder': 'Search songs, artists, tags, or score text',
    'search.tag': 'Tag',
    'search.title': 'Search',
    'search.titleScope': 'Title',
    'setlists.addFromLibrary': 'Add from Library',
    'setlists.create': 'New Setlist',
    'setlists.createPrompt': 'Enter a setlist name.',
    'setlists.deleteTitle': 'Delete Setlist',
    'setlists.deleteConfirm': 'Delete this setlist?',
    'setlists.editDate': 'Edit Date',
    'setlists.editEventName': 'Edit Event Name',
    'setlists.editName': 'Rename',
    'setlists.empty': 'No setlists yet.',
    'setlists.renameDatePrompt': 'YYYY-MM-DD',
    'setlists.selectedEmpty': 'Select a setlist or create a new one.',
    'setlists.order': 'Song Order',
    'setlists.title': 'Setlists',
    'settings.account': 'Account',
    'settings.accountSubtitle': 'Sign-in and account management',
    'settings.appSettings': 'App Settings',
    'settings.allLogs': 'All logs',
    'settings.allLogsView': 'View all logs',
    'settings.autoCropMargin': 'Auto Crop Margin',
    'settings.cloudSync': 'Cloud Sync',
    'settings.cloudAutoDescription':
      'Syncs automatically at app launch, resume, and network reconnection while signed in.',
    'settings.cloudForceSync': 'Sync all song data now',
    'settings.cloudForceSyncing': 'Syncing all songs…',
    'settings.cloudLogs': 'Sync log',
    'settings.cloudWifiOnly': 'Sync on Wi-Fi only',
    'settings.cloudWifiOnlyDescription':
      'Large PDF uploads run only over Wi-Fi.',
    'settings.developerMode': 'Developer Mode',
    'settings.displaySettings': 'Display',
    'settings.displaySubtitle': 'Theme, font size, and PDF viewing',
    'settings.defaultNavigationMode': 'Default Navigation Mode',
    'settings.defaultPageLayout': 'Default Page Layout',
    'settings.defaultZoom': 'Default Zoom',
    'settings.feedback': 'Feedback',
    'settings.feedbackSubtitle': 'Bug reports, feature requests, and support',
    'settings.fontSize': 'Font Size',
    'settings.homeSectionApp': 'App Settings',
    'settings.homeSectionSupport': 'Support',
    'settings.language': 'Language',
    'settings.languageDescription': 'Language for menus and feature text',
    'settings.languageTitle': 'Language Settings',
    'settings.languageValueEn': 'English',
    'settings.languageValueJa': 'Japanese',
    'settings.languageValueKo': 'Korean',
    'settings.languageValueLabel': 'Current language',
    'settings.subscription': 'Subscription',
    'settings.subscriptionSubtitle': 'Plans and billing',
    'settings.sync': 'Cloud Sync',
    'settings.syncSubtitle': 'Backup and network usage',
    'settings.landscapeLock': 'Landscape Lock',
    'settings.theme': 'Theme',
    'settings.title': 'Settings',
    'settings.versionInfo': 'Version Info',
    'settings.versionSubtitle': 'App version, release notes, and licenses',
    'subscription.currentPlan': 'Current Plan',
    'subscription.freePlan': 'Free',
    'subscription.manageBilling': 'Manage billing link',
    'subscription.premiumPlan': 'Premium',
    'subscription.redeem': 'Redeem',
    'subscription.redeemDescription':
      'Enter a MuList redeem code to activate Premium for your account.',
    'subscription.redeemInvalid': 'This redeem code is invalid or expired.',
    'subscription.redeemPlaceholder': 'Enter redeem code',
    'subscription.redeemRateLimited':
      'Too many attempts. Please try again shortly.',
    'subscription.redeemSignInRequired': 'Sign in before redeeming a code.',
    'subscription.redeemSuccess': 'Premium has been activated.',
    'subscription.redeemTitle': 'Redeem Code',
    'subscription.restorePurchases': 'Restore purchases',
    'subscription.startSubscription': 'Start subscription',
    'subscription.title': 'Subscription',
    'subscription.unavailable': 'Subscription features are not connected yet.',
    'version.build': 'Build',
    'version.legal': 'Legal',
    'version.openSourceLicenses': 'Open Source Licenses',
    'version.releaseNotes': 'Release Notes',
    'version.title': 'Version Info',
    'version.unavailable':
      'Terms of Service and Privacy Policy will be linked after the public URLs are finalized.',
    'viewer.drawing': 'Drawing',
    'viewer.eraser': 'Eraser',
    'viewer.highlighter': 'Highlighter',
    'viewer.hideMenu': 'Hide Menu',
    'viewer.menu': 'Menu',
    'viewer.navigationMode': 'Navigation Mode',
    'viewer.pageView': 'Page View',
    'viewer.pen': 'Pen',
    'viewer.scoreSettings': 'Score Settings',
    'viewer.scroll': 'Vertical Scroll',
    'viewer.scrollHorizontal': 'Horizontal Scroll',
    'viewer.snapHorizontal': 'Horizontal Snap',
    'viewer.setlist': 'Setlist',
    'viewer.singlePage': '1 page',
    'viewer.snapVertical': 'Vertical Snap',
    'viewer.title': 'Score Viewer',
    'viewer.twoPage': '2 pages',
    'viewer.view': 'View',
    'viewer.zoomIn': 'Zoom in',
    'viewer.zoomOut': 'Zoom out',
  },
  ja: {
    'common.backToLibrary': '‹ ライブラリ',
    'common.backToSettings': '‹ 設定',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.confirm': '確認',
    'common.loading': '処理中…',
    'common.none': '-',
    'account.appleLogin': 'Appleでサインイン',
    'account.cloudNotice': 'Cloud 機能はサインイン後に利用できます。',
    'account.deleteAccount': 'アカウント削除',
    'account.deleteConfirmBody':
      'Firebaseアカウントを完全に削除します。最近のログインが必要な場合があります。',
    'account.deleteConfirmTitle': 'アカウント削除',
    'account.email': 'メールアドレス',
    'account.emailPlaceholder': 'email@example.com',
    'account.emailStart': 'メールで始める',
    'account.firebaseUid': 'Firebase UID',
    'account.googleLogin': 'Googleでログイン',
    'account.login': 'ログイン',
    'account.loginMethod': 'ログイン方法',
    'account.logout': 'ログアウト',
    'account.notSignedIn': '未ログイン',
    'account.passwordPlaceholder': 'パスワード（6文字以上）',
    'account.register': '登録',
    'account.signInWithEmail': 'メールで始める',
    'account.title': 'アカウント',
    'display.autoCropDescription': '楽譜の余白を自動で調整します。',
    'display.defaultNavigationMode': 'Default Navigation Mode',
    'display.defaultNavigationModeDescription':
      '楽譜を送るときの既定の移動方法です。',
    'display.defaultPageLayout': 'Default Page Layout',
    'display.defaultPageLayoutDescription':
      '楽譜を開くときの既定ページ表示です。',
    'display.defaultZoom': 'Default Zoom',
    'display.defaultZoomDescription': 'PDFを開く時の既定ズーム倍率です。',
    'display.fontSize': 'Font Size',
    'display.fontSizeDescription': '一覧と設定画面で使う文字サイズです。',
    'display.fontLarge': '大',
    'display.fontMedium': '中',
    'display.fontSmall': '小',
    'display.landscapeLock': 'Landscape Lock',
    'display.landscapeLockDescription': 'PDF Viewerを横向きに固定します。',
    'display.pencilSmoothing': 'Apple Pencil 曲線補正',
    'display.pencilSmoothingDescription':
      '0は補正なし、10は最も強い曲線補正です。',
    'display.themeDark': 'ダーク',
    'display.themeLight': 'ライト',
    'display.themeSystem': 'システム',
    'display.theme': 'Theme',
    'display.themeDescription': 'アプリの既定の配色モードを選択します。',
    'developer.createTestSetlist': 'テストSetlistを作成',
    'developer.createTestSong': 'テストSongを作成',
    'developer.database': 'Database',
    'developer.description': '診断とテスト用ツールを表示します。',
    'developer.debug': 'Debug',
    'developer.loadingError': '処理に失敗しました。',
    'developer.ocr': 'OCR',
    'developer.packageUsage': 'Song Package / 使用量を見る',
    'developer.pdfPreviewScale': 'PDF低解像度プレビュー品質',
    'developer.pdfPreviewScaleDescription':
      '優先レンダリング範囲外のページに使う解像度です。高いほど鮮明ですが、メモリと描画時間が増えます。',
    'developer.resetConfirmBody': 'すべてのSongとSetlistを削除します。',
    'developer.resetConfirmTitle': 'Databaseを初期化',
    'developer.resetDatabase': 'Databaseを初期化',
    'developer.rerunOcr': 'OCRを強制再実行',
    'developer.stats': 'Song数 / Database情報',
    'developer.storage': 'Storage',
    'developer.sync': 'Sync',
    'developer.syncStatus': 'Sync状態: Sync Queue未構成',
    'developer.title': 'Developer Mode',
    'developer.viewOcrResult': 'OCR結果を見る',
    'feedback.bodyPrompt': '内容を入力してください。',
    'feedback.bugReport': 'バグ報告',
    'feedback.contact': 'お問い合わせ',
    'feedback.description': '起きたことと再現手順を教えてください。',
    'feedback.diagnosticsTitle': '含まれる診断情報',
    'feedback.featureRequest': '機能提案',
    'feedback.intro':
      'メールアプリを開いて意見を送ります。問題解決のため、アプリと端末情報が自動で含まれます。',
    'feedback.title': 'フィードバック',
    'language.description':
      'アプリ全体のメニューと機能テキストの表示言語を選びます。',
    'language.english': '英語',
    'language.japanese': '日本語',
    'language.korean': '韓国語',
    'language.title': '言語',
    'library.all': 'すべて',
    'library.emptyFavoritesDescription': 'よく使う曲に星を付けてください。',
    'library.emptyFavoritesTitle': 'お気に入りはありません',
    'library.emptyFirstDescription':
      'PDF楽譜を取り込むと曲ごとに整理できます。',
    'library.emptyFirstTitle': '最初の曲を追加しましょう',
    'library.emptyRecentDescription': '曲を開くとここに表示されます。',
    'library.emptyRecentTitle': '最近使用した曲はありません',
    'library.emptyTagsDescription':
      '曲にタグを追加するか、別のタグを選択してください。',
    'library.emptyTagsTitle': '選択したタグの曲はありません',
    'library.emptyTrashDescription': '削除した曲は30日間保管されます。',
    'library.emptyTrashTitle': 'ゴミ箱は空です',
    'library.editSong': '曲情報を編集',
    'library.favorites': 'お気に入り',
    'library.friend': '友達',
    'library.importPdf': '＋ PDFを取り込む',
    'library.latest': 'ライブラリは最新です。',
    'library.recent': '最近',
    'library.search': '検索',
    'library.setlists': 'セットリスト',
    'library.settings': '設定',
    'library.title': 'ライブラリ',
    'library.tags': 'タグ',
    'library.trash': 'ゴミ箱',
    'logs.clear': 'すべて消去',
    'logs.empty': '保存されたログはありません。',
    'logs.loading': '読み込み中…',
    'logs.recent': '最近のログ',
    'logs.refresh': '更新',
    'profile.bio': '自己紹介',
    'profile.bioPlaceholder': '演奏活動や興味を簡単に紹介してください。',
    'profile.cloudSaved': 'プロフィールを保存しました。',
    'profile.color': 'プロフィールカラー',
    'profile.localSaved': '端末に保存しました。Cloud接続時に同期します。',
    'profile.name': '名前',
    'profile.namePlaceholder': '表示名',
    'profile.part': 'メインパート',
    'profile.save': 'プロフィールを保存',
    'profile.saving': '保存中…',
    'profile.title': 'プロフィール',
    'score.artist': 'アーティスト',
    'score.bpmInvalid': 'BPMは30〜300の範囲で入力してください。',
    'score.bpmUnset': '未設定',
    'score.cancel': 'キャンセル',
    'score.save': '保存',
    'score.saving': '保存中…',
    'score.settings': '楽譜設定',
    'score.tags': 'タグ',
    'score.title': 'タイトル',
    'score.titleRequired': 'タイトルを入力してください。',
    'search.all': 'すべて',
    'search.artist': 'アーティスト',
    'search.emptyQuery': '検索語を入力してください。',
    'search.emptyResults': '結果がありません。',
    'search.ocr': 'OCR',
    'search.placeholder': '曲、アーティスト、タグ、楽譜内容を検索',
    'search.tag': 'タグ',
    'search.title': '検索',
    'search.titleScope': 'タイトル',
    'setlists.addFromLibrary': 'ライブラリから追加',
    'setlists.create': '新しいセットリスト',
    'setlists.createPrompt': 'セットリスト名を入力してください。',
    'setlists.deleteTitle': 'セットリストを削除',
    'setlists.deleteConfirm': 'このセットリストを削除しますか？',
    'setlists.editDate': '日付を変更',
    'setlists.editEventName': 'イベント名を変更',
    'setlists.editName': '名前を変更',
    'setlists.empty': 'セットリストがありません。',
    'setlists.renameDatePrompt': 'YYYY-MM-DD',
    'setlists.selectedEmpty':
      'セットリストを選択するか、新しく作成してください。',
    'setlists.order': '曲順',
    'setlists.title': 'セットリスト',
    'settings.account': 'アカウント',
    'settings.accountSubtitle': 'サインインとアカウント管理',
    'settings.appSettings': 'アプリ設定',
    'settings.allLogs': 'すべてのログ',
    'settings.allLogsView': 'すべてのログを見る',
    'settings.autoCropMargin': 'Auto Crop Margin',
    'settings.cloudSync': 'クラウド同期',
    'settings.cloudAutoDescription':
      'ログイン中はアプリ起動・復帰・ネットワーク再接続時に自動同期します。',
    'settings.cloudForceSync': '今すぐすべての曲データを同期',
    'settings.cloudForceSyncing': 'すべての曲を同期中…',
    'settings.cloudLogs': '同期ログ',
    'settings.cloudWifiOnly': 'Wi-Fi接続時のみ同期',
    'settings.cloudWifiOnlyDescription':
      '大容量PDFのアップロードはWi-Fi接続時のみ実行します。',
    'settings.developerMode': 'Developer Mode',
    'settings.displaySettings': '表示設定',
    'settings.displaySubtitle': 'テーマ、文字サイズ、PDF表示',
    'settings.defaultNavigationMode': 'Default Navigation Mode',
    'settings.defaultPageLayout': 'Default Page Layout',
    'settings.defaultZoom': 'Default Zoom',
    'settings.feedback': 'フィードバック',
    'settings.feedbackSubtitle': '不具合報告、機能提案、問い合わせ',
    'settings.fontSize': 'Font Size',
    'settings.homeSectionApp': 'アプリ設定',
    'settings.homeSectionSupport': 'サポート',
    'settings.language': '言語',
    'settings.languageDescription': 'メニューと機能テキストの言語',
    'settings.languageTitle': '言語設定',
    'settings.languageValueEn': '英語',
    'settings.languageValueJa': '日本語',
    'settings.languageValueKo': '韓国語',
    'settings.languageValueLabel': '現在の言語',
    'settings.subscription': 'サブスクリプション',
    'settings.subscriptionSubtitle': 'プランと支払い管理',
    'settings.sync': 'クラウド同期',
    'settings.syncSubtitle': 'バックアップとネットワーク使用',
    'settings.landscapeLock': 'Landscape Lock',
    'settings.theme': 'Theme',
    'settings.title': '設定',
    'settings.versionInfo': 'バージョン情報',
    'settings.versionSubtitle':
      'アプリのバージョン、リリースノート、ライセンス',
    'subscription.currentPlan': '現在のプラン',
    'subscription.freePlan': 'Free',
    'subscription.manageBilling': '支払い管理リンク',
    'subscription.premiumPlan': 'Premium',
    'subscription.redeem': '交換',
    'subscription.redeemDescription':
      'MuListのコードを入力するとPremiumが有効になります。',
    'subscription.redeemInvalid': '無効または期限切れのコードです。',
    'subscription.redeemPlaceholder': 'コードを入力',
    'subscription.redeemRateLimited':
      '試行回数が多すぎます。しばらくしてから再試行してください。',
    'subscription.redeemSignInRequired':
      'コードを使用するにはログインしてください。',
    'subscription.redeemSuccess': 'Premiumが有効になりました。',
    'subscription.redeemTitle': 'コード交換',
    'subscription.restorePurchases': '購入を復元',
    'subscription.startSubscription': 'サブスクリプション開始',
    'subscription.title': 'サブスクリプション',
    'subscription.unavailable':
      'サブスクリプション機能はまだ接続されていません。',
    'version.build': 'Build',
    'version.legal': 'Legal',
    'version.openSourceLicenses': 'Open Source Licenses',
    'version.releaseNotes': 'Release Notes',
    'version.title': 'バージョン情報',
    'version.unavailable':
      '利用規約とプライバシーポリシーは公開URL確定後にリンクします。',
    'viewer.drawing': '描画',
    'viewer.eraser': '消しゴム',
    'viewer.highlighter': '蛍光ペン',
    'viewer.hideMenu': 'メニューを隠す',
    'viewer.menu': 'メニュー',
    'viewer.navigationMode': '移動方法',
    'viewer.pageView': 'ページ表示',
    'viewer.pen': 'ペン',
    'viewer.scoreSettings': '楽譜設定',
    'viewer.scroll': '縦スクロール',
    'viewer.scrollHorizontal': '横スクロール',
    'viewer.snapHorizontal': '横スナップ',
    'viewer.setlist': 'セットリスト',
    'viewer.singlePage': '1ページ',
    'viewer.snapVertical': '縦スナップ',
    'viewer.title': '楽譜ビューア',
    'viewer.twoPage': '2ページ',
    'viewer.view': '表示',
    'viewer.zoomIn': '拡大',
    'viewer.zoomOut': '縮小',
  },
};

let currentLanguage: AppLanguage = 'ko';

export function setAppLanguage(language: AppLanguage): void {
  currentLanguage = language;
}

export function getAppLanguage(): AppLanguage {
  return currentLanguage;
}

export function getLanguageNames(): Record<AppLanguage, string> {
  return languageNames;
}

export function t(key: TranslationKey): string {
  return dictionaries[currentLanguage][key] ?? dictionaries.ko[key];
}
