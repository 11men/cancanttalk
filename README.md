# CanCantTalk 🎯

1020 MZ를 위한 '찐력 테스트' 커뮤니티 플랫폼.
Next.js 16 (App Router) + Supabase + Vercel.

## 🚀 시작하기

### 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 프로젝트 생성
2. **Settings → API** 에서 URL, anon key, service_role key 복사
3. **SQL Editor** 에서 아래 순서대로 실행:
   - `supabase/migrations/20260421000001_init_schema.sql`
   - `supabase/migrations/20260421000002_seed_data.sql`

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 채우기
```

### 3. OAuth 공급자 설정 (Supabase Dashboard)

**Authentication → Providers** 에서:
- **Kakao**: [Kakao Developers](https://developers.kakao.com) 앱 등록 → Client ID/Secret 입력
- **Google**: [Google Cloud Console](https://console.cloud.google.com) OAuth 2.0 Client 생성 → 입력
- Redirect URL: `https://<project>.supabase.co/auth/v1/callback`

### 4. 개발 서버

```bash
npm run dev
# http://localhost:3000
```

### 5. 어드민 권한 부여

SQL Editor에서:
```sql
update public.profiles set is_admin = true where nickname = '본인_닉네임';
```

## 📁 구조

```
src/
├── app/
│   ├── page.tsx               # 카테고리 선택 (Server Component)
│   ├── categories/[slug]/     # 카드 슬라이드 + 투표
│   ├── submit/                # UGC 제보
│   ├── admin/                 # 검수
│   ├── profile/               # 성향 분석
│   ├── ranking/               # 베스트 제보자
│   ├── login/                 # OAuth 로그인
│   └── auth/callback/         # OAuth 콜백
├── actions/                   # Server Actions (vote, comment, ...)
├── components/                # UI 컴포넌트
├── lib/
│   ├── supabase/              # 서버/클라이언트/프록시 클라이언트
│   ├── shuffle.ts             # 날짜 seed 셔플
│   └── persona.ts             # 성향 분석 로직
├── types/database.ts          # Supabase 타입
└── proxy.ts                   # Next.js 16 proxy (구 middleware, 세션 갱신)

supabase/migrations/           # 스키마 + 시드 SQL
docs/                          # 원본 plan.md, challenge.html
```

## 🔑 주요 결정

- **RLS 전면 적용**: 투표·댓글·질문 권한은 DB 레벨에서 차단
- **denormalization**: `questions.vote_count`, `comments.like_count` 는 trigger로 갱신
- **셔플**: 날짜 seed → 당일 같은 순서, 다음날 달라짐
- **Realtime**: 댓글만 구독 (투표 집계는 revalidate로 충분)

## 🚢 배포 (마지막 단계)

Vercel 연결 → 환경변수 3개 입력 → `main` push = 끝.
Site URL은 Supabase **Authentication → URL Configuration** 에도 추가해야 OAuth 콜백이 작동합니다.
