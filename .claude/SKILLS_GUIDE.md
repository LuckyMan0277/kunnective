# 스킬 시스템 가이드

이 프로젝트에는 Next.js + Supabase 개발을 위한 커스텀 스킬들이 포함되어 있습니다.

## 📚 사용 가능한 스킬

### 1. **nextjs-supabase-setup**
**설명**: Next.js 프로젝트에 Supabase 초기 설정을 자동화합니다.

**언제 사용하나요?**
- "Supabase를 설정해줘"
- "Supabase 클라이언트를 만들어줘"
- "환경변수를 설정해줘"

**제공 기능**:
- ✅ Supabase 패키지 설치
- ✅ 환경 변수 템플릿 생성
- ✅ 클라이언트/서버 Supabase 인스턴스 생성
- ✅ Middleware 설정
- ✅ TypeScript 타입 생성

---

### 2. **supabase-auth-implementation**
**설명**: Supabase Auth를 사용한 인증 시스템 구현을 돕습니다.

**언제 사용하나요?**
- "회원가입 기능을 만들어줘"
- "로그인 시스템을 구현해줘"
- "인증 시스템을 추가해줘"

**제공 기능**:
- ✅ 회원가입 (Sign Up)
- ✅ 로그인 (Sign In)
- ✅ 로그아웃 (Sign Out)
- ✅ 이메일 인증
- ✅ 비밀번호 재설정
- ✅ OAuth 로그인 (Google)
- ✅ Protected Routes
- ✅ useAuth Hook

---

### 3. **supabase-database-schema**
**설명**: PostgreSQL 데이터베이스 스키마 설계 및 마이그레이션을 지원합니다.

**언제 사용하나요?**
- "데이터베이스 스키마를 만들어줘"
- "users 테이블을 생성해줘"
- "마이그레이션 파일을 작성해줘"

**제공 기능**:
- ✅ 테이블 생성
- ✅ 관계 설정 (1:N, N:M)
- ✅ 인덱스 추가
- ✅ 트리거 및 함수 작성
- ✅ Full-text Search
- ✅ ENUM 타입
- ✅ TypeScript 타입 생성

---

### 4. **supabase-realtime**
**설명**: Supabase Realtime을 사용한 실시간 기능 구현을 돕습니다.

**언제 사용하나요?**
- "실시간 채팅을 구현해줘"
- "실시간 알림을 추가해줘"
- "WebSocket으로 데이터 동기화해줘"

**제공 기능**:
- ✅ 실시간 메시지 구독
- ✅ 실시간 알림
- ✅ Presence (온라인 상태)
- ✅ Broadcast (브로드캐스트)
- ✅ 낙관적 업데이트
- ✅ 실시간 데이터 동기화
- ✅ 연결 상태 모니터링

---

### 5. **supabase-rls**
**설명**: Row Level Security (RLS) 정책 설계 및 구현을 돕습니다.

**언제 사용하나요?**
- "RLS 정책을 만들어줘"
- "데이터 접근 권한을 설정해줘"
- "본인 데이터만 볼 수 있게 해줘"

**제공 기능**:
- ✅ RLS 활성화
- ✅ 기본 정책 패턴
- ✅ 관계 기반 접근 제어
- ✅ 다중 조건 정책
- ✅ 상태 기반 접근 제어
- ✅ 정책 디버깅
- ✅ 성능 최적화

---

## 🚀 스킬 사용 방법

### 자동 활성화
스킬은 Claude가 당신의 요청을 분석하여 **자동으로 활성화**됩니다. 별도의 명령어를 입력할 필요가 없습니다.

**예시:**
```
사용자: "Supabase를 설정하고 회원가입 기능을 만들어줘"

→ Claude가 자동으로 다음 스킬들을 활성화:
   1. nextjs-supabase-setup
   2. supabase-auth-implementation
```

### 명시적 요청
특정 스킬을 명시적으로 요청할 수도 있습니다:

```
"supabase-rls 스킬을 사용해서 RLS 정책을 만들어줘"
```

---

## 📖 스킬 상세 가이드

각 스킬의 상세 가이드는 다음 파일에서 확인하세요:

- [nextjs-supabase-setup](.claude/skills/nextjs-supabase-setup/SKILL.md)
- [supabase-auth-implementation](.claude/skills/supabase-auth-implementation/SKILL.md)
- [supabase-database-schema](.claude/skills/supabase-database-schema/SKILL.md)
- [supabase-realtime](.claude/skills/supabase-realtime/SKILL.md)
- [supabase-rls](.claude/skills/supabase-rls/SKILL.md)

---

## 🔧 스킬 vs 서브에이전트

### 스킬 (Skills)
- **목적**: 특정 기능 구현을 위한 재사용 가능한 지식
- **예시**: Supabase 설정, RLS 정책 작성
- **활성화**: Claude가 자동으로 판단
- **범위**: 좁고 구체적

### 서브에이전트 (Subagents)
- **목적**: 복잡한 작업을 위한 완전한 독립 AI 에이전트
- **예시**: 프로젝트 전체 초기화, 인증 시스템 구축
- **활성화**: 명시적 호출 필요
- **범위**: 넓고 포괄적

**함께 사용하기:**
서브에이전트가 작업을 수행할 때 스킬을 활용할 수 있습니다.

```
예: auth-system 서브에이전트가 인증 시스템을 구축할 때
    → supabase-auth-implementation 스킬 사용
    → supabase-rls 스킬 사용 (권한 설정)
```

---

## 🎯 개발 워크플로우 예시

### Phase 1: 환경 설정
```
사용자: "프로젝트를 초기화하고 Supabase를 설정해줘"

→ 활성화되는 스킬:
   - nextjs-supabase-setup
```

### Phase 2: 인증 시스템
```
사용자: "회원가입과 로그인 기능을 구현해줘. 건국대 이메일만 허용해야 해"

→ 활성화되는 스킬:
   - supabase-auth-implementation
   - supabase-database-schema (users 테이블)
   - supabase-rls (프로필 접근 권한)
```

### Phase 3: 아이디어 게시판
```
사용자: "아이디어 게시판을 만들고 실시간 좋아요 기능을 추가해줘"

→ 활성화되는 스킬:
   - supabase-database-schema (ideas, likes 테이블)
   - supabase-realtime (실시간 좋아요 업데이트)
   - supabase-rls (게시글 접근 권한)
```

### Phase 4: 채팅 시스템
```
사용자: "1:1 채팅과 그룹 채팅을 구현해줘"

→ 활성화되는 스킬:
   - supabase-database-schema (chat_rooms, messages)
   - supabase-realtime (실시간 메시지)
   - supabase-rls (채팅방 접근 권한)
```

---

## 💡 팁

### 1. 구체적으로 요청하기
```
❌ "데이터베이스를 만들어줘"
✅ "users, ideas, projects 테이블을 만들고 관계를 설정해줘"
```

### 2. 한 번에 여러 기능 요청
```
"Supabase를 설정하고, 인증 시스템을 구현하고, RLS 정책을 추가해줘"

→ 여러 스킬이 순차적으로 활성화됩니다
```

### 3. 스킬 파일 직접 참고
코드 예제가 필요하면 스킬 파일을 직접 열어보세요:
```
.claude/skills/supabase-realtime/SKILL.md
```

---

## 🐛 문제 해결

### 스킬이 활성화되지 않을 때
1. 요청을 더 구체적으로 작성
2. 스킬 이름을 명시적으로 언급
3. 스킬 description의 키워드 사용

### 잘못된 스킬이 활성화될 때
요청에 구체적인 기술 스택 명시:
```
"Supabase Realtime을 사용해서 실시간 채팅을 구현해줘"
```

---

## 📝 커스텀 스킬 만들기

필요한 스킬이 없다면 직접 만들 수 있습니다:

1. `.claude/skills/your-skill/` 디렉토리 생성
2. `SKILL.md` 파일 작성
3. frontmatter에 name, description 추가
4. 상세 가이드 작성

**예시:**
```markdown
---
name: my-custom-skill
description: "이 스킬이 무엇을 하는지 설명. 키워드 포함."
---

# My Custom Skill

스킬 내용...
```

---

## 📚 참고 자료

- [Claude Code 공식 문서](https://docs.anthropic.com/claude-code)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 공식 문서](https://nextjs.org/docs)

---

**Made with ❤️ for KU-Connect Project**
