# CanCantTalk 🎯

1020을 위한 익명 투표 커뮤니티 — "이게 가능?" 한 줄 질문에 가능/불가능으로 답하는 도파민 플랫폼.

**Stack**: Next.js 16 (App Router) · Supabase · Tailwind v4 · Vercel.

---

## 🚀 시작하기

### 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 프로젝트 생성
2. **Settings → API** 에서 `Project URL`, `anon key` 복사
3. **SQL Editor** 에서 아래 순서대로 실행:
   - `supabase/migrations/20260421000001_init_schema.sql` (스키마 초기화)
   - `supabase/migrations/20260421000002_seed_data.sql` (카테고리/시드 질문)
   - `supabase/migrations/20260423000001_anonymous_community.sql` (익명 모델 전환 + 대댓글)

### 2. 환경변수 (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SITE_URL=https://your-domain.com    # 선택, OG/sitemap에 사용
ADMIN_KEY=<원하는 비밀 문자열>                    # /admin 게이트 통과용
```

### 3. 개발 서버

```bash
npm install
npm run dev
# http://localhost:3000
```

### 4. 검수 페이지 진입

`/admin` → ADMIN KEY 입력 → 대기 중인 제보 승인/반려.

---

## 🧠 도메인 모델 (익명)

- **로그인 없음**. `proxy.ts`가 첫 방문 시 `anon_id` 쿠키(1년 유지)를 발급.
- 투표는 `(anon_id, question_id)` 복합 PK로 1회 보장.
- 댓글은 닉네임 직접 입력 + `parent_id`로 대댓글 1단 지원.
- 어드민은 쿠키 기반 키 매칭 — `ADMIN_KEY` env와 일치해야 검수 큐 접근 가능.

## 🪝 후킹 카피 시스템

`src/lib/hook-copy.ts` — 투표수/비율에 따라 카드 미끼 카피와 결과 헤드라인을 동적으로 생성.

- 투표 전: "N명이 갈렸어 · 결과 보러 ↓" / "정확히 반반 · 너로 결정남"
- 투표 후: 압도(90:10) → "이건 못 참지 — N% 압도", 박빙(5:5) → "진짜 미친 N:N · 너로 결정남" 등
- 카테고리 라벨도 `src/lib/category-style.ts`에서 후킹 표현으로 매핑("연애" → "썸 vs 손절").

## 📁 구조

```
src/
├── app/
│   ├── page.tsx               # 홈: 카테고리 카드
│   ├── categories/[slug]/     # 챌린지 카드 슬라이더
│   ├── submit/                # UGC 제보 폼
│   ├── admin/                 # 검수 큐 (ADMIN_KEY 게이트)
│   ├── ranking/               # 핫 챌린지 TOP
│   ├── opengraph-image.tsx    # OG 이미지 (호기심 갭)
│   ├── sitemap.ts             # ISR sitemap
│   └── layout.tsx
├── actions/                   # Server Actions: vote, comment, submit, moderate
├── components/                # ChallengeSlider, ResultGauge, CommentSheet, Marquee, Header
├── lib/
│   ├── supabase/              # server / client / anon-server (cookieless ISR용)
│   ├── anon.ts                # anon_id / 닉네임 쿠키 헬퍼
│   ├── hook-copy.ts           # 후킹 카피 생성기
│   ├── category-style.ts      # 카테고리 라벨/스타일 매핑
│   └── shuffle.ts             # 날짜 seed 셔플
├── types/database.ts          # Supabase 스키마 타입
└── proxy.ts                   # Next.js 16 proxy — anon_id 쿠키 발급

supabase/migrations/           # 스키마 + 시드 + 익명 전환 SQL
```

## 🔑 주요 결정

- **익명 + RLS 공개 INSERT**: 로그인 없이도 RLS는 살리되 INSERT를 public 허용. status 변경(승인/반려)은 service_role 전용.
- **denormalization**: `vote_count` / `yes_count` / `like_count` 등은 trigger로 자동 갱신.
- **ISR 정적화**: 홈/랭킹/sitemap은 cookieless `anon-server` 클라이언트로 정적 prerender.
- **Tailwind v4 shortform**: prod purge 회피를 위해 `bg-(--paper)` / `text-(--ink)/70` 형식 사용. compound shadow는 inline `style`로 분리.

## 🚢 배포

`main` push → Vercel 자동 배포.

Vercel **Settings → Environment Variables** 에 위 4개 env 등록 필요.
