-- ============================================================================
-- 시드 질문 리프레시
-- 실행 위치: Supabase Dashboard > SQL Editor (전체 복사 후 Run)
--
-- 목적: 기획 분석에서 약하다고 판단된 질문 교체
--   - "지하철 노래 크게 틀고" (5점) — 결과 너무 뻔함
--   - "엘베에서 먼저 인사" (4점) — 결과 너무 뻔함
--   - "친구 앞 부모 잔소리 흉내" (6점) — 무난, 폭발 약함
--
-- 새 질문 패턴: "내가 진짜 매일 갈등하는 것" + "결과가 진짜 모르겠는 것"
-- 50:50 갈 가능성 높은 회색지대 질문 위주로 추가.
--
-- 주의: 이미 투표가 쌓인 질문은 건드리지 않음(content 매칭 기반 update만).
--       이 SQL은 idempotent — 여러 번 실행해도 안전.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 약한 질문 교체 (vote_count 0인 것만 수정)
-- ----------------------------------------------------------------------------

update public.questions
   set content = '카톡 안 읽씹 일주일 채우기 가능?'
 where content = '지하철에서 최애 노래 크게 틀고 리듬타기 가능?'
   and vote_count = 0;

update public.questions
   set content = '동아리 단체방에서 나만 빠진 셀카에 ㅇㅇ만 찍기 가능?'
 where content = '엘베에서 모르는 사람한테 먼저 인사하기 가능?'
   and vote_count = 0;

update public.questions
   set content = '친구가 사 준 옷 솔직하게 ‘별로’라고 말하기 가능?'
 where content = '친구 앞에서 부모님 잔소리 흉내내기 가능?'
   and vote_count = 0;

-- ----------------------------------------------------------------------------
-- 2. 신규 질문 추가 (카테고리당 2~3개)
--    cat_id는 categories 테이블의 slug로 lookup
-- ----------------------------------------------------------------------------

insert into public.questions (category_id, content, difficulty, status, anon_id, author_nickname)
select c.id, q.content, q.difficulty, 'approved', null, '운영자'
from (values
  -- love (썸 vs 손절)
  ('love', '썸인 줄 알았는데 그냥 친한 줄로 정리하기 가능?', 4),
  ('love', '데이트 도중 화장실에서 친구한테 “구해줘” 카톡 가능?', 3),
  ('love', '전 애인 인스타 스토리 보고 답장 다시 안 하기 가능?', 4),

  -- social (사장 vs 알바)
  ('social', '월급날 다음 날 “저 그만둘게요” 통보 가능?', 5),
  ('social', '회식 자리에서 술 안 마시고 끝까지 버티기 가능?', 3),
  ('social', '단톡 공지 읽씹하고 다음날 “못 봤다” 시전 가능?', 2),

  -- hobby (취미 미친썰)
  ('hobby', '최애 콘서트 티켓팅 실패하고 친구 자랑 듣기 가능?', 4),
  ('hobby', '게임 랭크 떨어지고 한 달 동안 안 켜기 가능?', 3),
  ('hobby', '아이돌 입덕 6개월 만에 환승 가능?', 3),

  -- daily (일상 광기)
  ('daily', '지하철에서 졸다가 안 내리고 종점까지 가기 가능?', 3),
  ('daily', '하루 종일 휴대폰 무음 + 알림 무시 가능?', 4),
  ('daily', '편의점에서 1만원 카드 결제하기 민망해서 그냥 안 사기 가능?', 2)
) as q(slug, content, difficulty)
join public.categories c on c.slug = q.slug
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 3. 확인용 — 카테고리별 approved 질문 수
-- ----------------------------------------------------------------------------

-- select c.slug, count(q.id) as approved_count
--   from public.categories c
--   left join public.questions q on q.category_id = c.id and q.status = 'approved'
--  group by c.slug
--  order by c.order_index;
