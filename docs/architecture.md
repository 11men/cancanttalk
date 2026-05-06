# Architecture

## 도메인 모델 — 익명 투표 커뮤니티

서비스의 모든 사용자 식별은 **브라우저 쿠키 `anon_id`(uuid, 1년 만료) 단 한 개**로 이루어진다. 로그인·세션·이메일·OAuth 모두 없다.

### 식별·인증 흐름

```
첫 방문
   ↓
proxy.ts → 쿠키에 anon_id 없음 → uuid 생성해 set-cookie (httpOnly, sameSite=lax, secure in prod, 1년)
   ↓
이후 모든 요청에 anon_id 자동 동봉
   ↓
src/lib/anon.ts::getAnonId() 로 서버에서 읽어 DB 쿼리에 사용
```

### 핵심 테이블 관계

```
categories  ──────────────────────────────┐
   │                                       │
   ▼                                       │
questions  (anon_id, author_nickname)     │
   │                                       │
   ├─→ votes (anon_id + question_id PK)   │
   │                                       │
   └─→ comments (anon_id, nickname,       │
                 parent_id ▶ 자기 참조)    │
            │                              │
            └─→ comment_reactions          │
                (anon_id + comment_id PK)  │
```

집계는 trigger로 채운다:
- `votes` 변경 → `questions.vote_count` / `yes_count` 갱신
- `comment_reactions` 변경 → `comments.like_count` / `dislike_count` 갱신

### RLS 정책

전체 활성. 단:
- 모든 read는 public select 허용
- INSERT는 public 허용 (어차피 anon_id가 본인 식별)
- `questions.status` 변경(승인/반려)은 service_role만 — 즉 검수는 SQL Editor 또는 admin route에서 service-role-equivalent 권한으로

### 어드민 게이트

어드민은 별도 user 모델이 없다. 대신 `ADMIN_KEY` 환경변수와 일치하는 쿠키를 가진 요청만 검수 액션이 통과한다.

```
/admin POST { key } → cookieStore.set("admin_key", key, ...)
서버 액션 모두 isAdmin() 통과 후에만 mutate
```

분실 시: `vercel env rm ADMIN_KEY production` 후 재발급 → 사용자에게 한 번만 노출.

---

## 후킹 카피 시스템

서비스 톤은 1020 도파민. 카피가 정적 텍스트가 아니라 **현재 vote_count·비율에 따라 매번 다르게** 생성된다.

### 책임 분리

| 모듈 | 역할 |
|---|---|
| `src/lib/hook-copy.ts` | 투표수·yes_pct → 미끼/헤드라인/코호트 카피 생성 |
| `src/lib/category-style.ts` | 카테고리 slug → 표시명 + 카드 색상/회전 매핑 |
| `src/components/ChallengeSlider.tsx` | 카드 위에 미끼 카피 / 투표 후 결과 슬롯 노출 |
| `src/components/ResultGauge.tsx` | 결과 헤드라인 + 코호트 라인 + 게이지 |

### 카피 분포 매트릭스

```
투표 0건             → "다들 한 번씩은 본 상황" / "익명이라 솔직 모드" (랜덤)
투표 1~4건 (소수)    → "N명 갈렸음 · 너가 결정타"
yes 45~55% (박빙)   → "N명이 정확히 반반 · 너로 결정남"
yes 90% / 10% (편중) → "N명 중 X% 한 쪽으로 쏠림"
그 외                → "N명이 갈렸어 · 결과 보러 ↓"
```

투표 후 ResultGauge 헤드라인:

```
totalCount < 3            → "첫 투표자 · 너가 판세 만든다"
dom >= 90                 → "이건 못 참지 — <side> N% 압도"
dom >= 70                 → "대세는 <side> N%"
dom >= 56                 → "<side> 우세 · 그래도 N%는 반대"
그 외                     → "진짜 미친 X:Y · 너로 결정남"
```

### 안티패턴

- 가짜 숫자 하드코딩 ("1,247명이 갈렸어!"를 항상 표시) — 1020 타겟이 즉시 알아챔
- 메인 라벨까지 슬랭화 ("ㅇㅇ"/"ㄴㄴ"만으로 버튼) — 접근성 떨어지고 브랜드 일관성 깨짐
- 가르침 톤 ("~하는 법" / "~비결") — 책 ‘후킹’의 안티패턴 그대로

---

## ISR과 라우트 분류

`cookies()`를 읽는 라우트는 Next.js가 강제 dynamic으로 처리. 실제로 anon_id가 **없어도 되는** 페이지는 cookieless 클라이언트를 써서 정적 prerender한다.

| 라우트 | 분류 | 이유 |
|---|---|---|
| `/` | ○ static (1m revalidate) | 카테고리 카운트만 조회, anon_id 무관 |
| `/ranking` | ○ static (5m revalidate) | hot 질문 조회만 |
| `/sitemap.xml` | ○ static | 카테고리 slug 목록 |
| `/categories/[slug]` | ƒ dynamic | 사용자 myVote 조회에 anon_id 필요 |
| `/admin` | ƒ dynamic | admin_key 쿠키 검사 |
| `/submit` | ƒ dynamic | 닉네임 쿠키 |

cookieless 클라이언트는 `src/lib/supabase/anon-server.ts`. 일반 `createClient`(server.ts)는 SSR 세션 갱신용으로 cookies를 읽기에 ISR과 못 섞는다.

---

## 컴포넌트 흐름 (낙관적 업데이트)

투표는 두 단계 옵티미스틱:

```
1. setOptimistic({ id: choice })
2. setVoteBoost({ id: { yes: +1, total: +1 } })
3. server action castVote()
4. 실패 시 둘 다 롤백
```

ResultGauge는 `current.yes_count + boost.yes` / `current.vote_count + boost.total`로 계산해 즉시 게이지가 채워진다. trigger가 DB에서 비동기로 카운트를 갱신해도 다음 ISR revalidate 때 정합성 맞춰짐.

댓글 시트는 두 useEffect로 분리:
- `[open, questionId]` → 초기 fetch
- `[questionId]` → realtime channel 구독 (open 토글로 재구독 안 함)

분리 안 하면 시트 열고 닫을 때마다 채널 재구독 → race condition.
