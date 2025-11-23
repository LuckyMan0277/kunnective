# KU-Connect Mobile App

건국대학교 아이디어 공유 및 팀 빌딩 플랫폼 - 모바일 앱

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm or pnpm
- Expo Go 앱 (iOS/Android)

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Supabase 정보 입력
```

### 실행

```bash
# 개발 서버 시작
npm start

# iOS 시뮬레이터에서 실행 (macOS only)
npm run ios

# Android 에뮬레이터에서 실행
npm run android

# 웹 브라우저에서 실행
npm run web
```

### 실제 기기에서 테스트

1. 앱 스토어에서 "Expo Go" 앱 설치
2. `npm start` 실행
3. QR 코드를 Expo Go 앱으로 스캔

## 📱 기능

- ✅ 로그인 / 회원가입
- ✅ 아이디어 목록 조회
- ✅ 프로젝트 목록 조회
- ✅ 프로필 조회
- ✅ 로그아웃

## 🛠️ 기술 스택

- **프레임워크**: Expo SDK 54
- **언어**: TypeScript
- **네비게이션**: React Navigation
- **상태 관리**: React Hooks
- **백엔드**: Supabase

## 📂 프로젝트 구조

```
mobile/
├── src/
│   ├── screens/       # 화면 컴포넌트
│   ├── lib/           # Supabase 설정
│   └── types/         # TypeScript 타입
├── App.tsx            # 앱 진입점
└── app.json           # Expo 설정
```

## 🔧 환경 변수

`.env` 파일에 다음 변수 설정:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📦 빌드

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## 📝 라이선스

MIT
