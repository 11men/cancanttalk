# ADR 0001 — 로그인 폐기, 익명 전환

- 상태: 채택
- 일자: 2026-04-23
- 결정자: 사용자 (kdelay)

## 배경

초기 구현은 Supabase Auth + Kakao/Google OAuth + `profiles` 테이블 1:1 매핑 모델이었다. 사용자 가입 마찰, OAuth provider 등록·관리 비용, "투표 한 번 하려고 로그인까지?"라는 1020 타겟의 진입 장벽을 모두 안고 있었다.

## 결정

OAuth/profiles/login 라우트 전체 제거. 식별은 브라우저 쿠키 `anon_id`(uuid v4) 단 하나로 통일.

- `proxy.ts`가 첫 방문에 `anon_id` 1년짜리 쿠키 발급
- 투표 PK = `(anon_id, question_id)` 복합 키로 1회 보장
- 댓글은 닉네임 직접 입력. 동일 anon_id가 여러 닉네임 사용 가능
- 댓글에 `parent_id` self-FK 추가해 1단 대댓글 지원
- 어드민은 별도 user 모델 없이 `ADMIN_KEY` env 매칭으로 게이트

## 결과

- ✅ 진입 마찰 0. URL 클릭만 하면 즉시 투표 가능
- ✅ 인프라 단순화(OAuth provider 관리 X, profiles 테이블 X, RLS user_id 정책 X)
- ⚠️ 닉네임 도용 가능성 — 같은 닉네임을 여러 anon_id가 쓸 수 있음. 1020 도파민 콘텐츠 성격상 허용 가능
- ⚠️ 다른 기기/브라우저에서 같은 사용자로 인식 안 됨 — 의도된 trade-off
- ⚠️ 도배·어뷰즈 시 차단할 단위가 anon_id뿐 — IP·rate limit 추가 검토 가능

## 마이그레이션

`supabase/migrations/20260423000001_anonymous_community.sql` — profiles drop, votes/comments 재생성, RLS public INSERT로 완화. **votes/comments 기존 데이터 삭제됨 (시드뿐이라 안전)**.

## 되돌릴 때

profiles 다시 만들고 `auth.users` 트리거 복구 → questions/votes/comments에 user_id FK 다시. 사실상 처음부터 다시. 이 프로젝트 컨셉(1020 도파민) 자체를 바꾸는 결정이라 가벼운 revert는 없음.
