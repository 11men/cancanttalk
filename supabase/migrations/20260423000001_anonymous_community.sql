-- ============================================================================
-- 익명 커뮤니티 전환 마이그레이션
-- 실행 위치: Supabase Dashboard > SQL Editor (전체 복사 후 Run)
--
-- 변경점:
--   - profiles / auth 의존성 전부 제거
--   - 유저 식별은 브라우저 쿠키의 anon_id(text) 기반
--   - 댓글에 parent_id 추가 → 대댓글 지원
--   - 댓글/질문에 nickname 저장 (작성자가 직접 입력)
--   - RLS 정책을 public INSERT 허용으로 완화
--
-- 주의: votes / comments / comment_reactions / profiles 의 기존 데이터는
--       모두 삭제됩니다 (테이블 drop 후 재생성). 시드/테스트 데이터뿐이므로 안전.
--       questions 테이블 본문 데이터는 보존됩니다.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 기존 트리거/FK 먼저 끊기 (drop 할 때 에러 방지)
-- ----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

alter table public.questions
  drop constraint if exists questions_author_id_fkey;

-- ----------------------------------------------------------------------------
-- 2. profiles 테이블 제거 (auth.users 1:1 매핑 테이블 불필요)
-- ----------------------------------------------------------------------------
drop table if exists public.profiles cascade;

-- ----------------------------------------------------------------------------
-- 3. questions: author 정보를 닉네임 + anon_id 기반으로
-- ----------------------------------------------------------------------------
alter table public.questions
  drop column if exists author_id;

alter table public.questions
  add column if not exists anon_id         text,
  add column if not exists author_nickname text;

create index if not exists idx_questions_anon on public.questions (anon_id);

-- ----------------------------------------------------------------------------
-- 4. votes: anon_id 기반 (PK = anon_id + question_id)
-- ----------------------------------------------------------------------------
drop table if exists public.votes cascade;

create table public.votes (
  anon_id     text not null,
  question_id uuid not null references public.questions(id) on delete cascade,
  choice      boolean not null,
  created_at  timestamptz not null default now(),
  primary key (anon_id, question_id)
);

create index if not exists idx_votes_question on public.votes (question_id);

-- 투표 집계 trigger 재연결 (함수는 기존 것 재사용)
drop trigger if exists trg_votes_counts on public.votes;
create trigger trg_votes_counts
  after insert or update or delete on public.votes
  for each row execute function public.update_question_vote_counts();

-- ----------------------------------------------------------------------------
-- 5. comments: 대댓글 + 닉네임
-- ----------------------------------------------------------------------------
drop table if exists public.comments cascade;

create table public.comments (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.questions(id) on delete cascade,
  parent_id     uuid references public.comments(id) on delete cascade,
  anon_id       text not null,
  nickname      text not null check (char_length(nickname) between 1 and 20),
  content       text not null check (char_length(content) between 1 and 500),
  like_count    int  not null default 0,
  dislike_count int  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_comments_question on public.comments (question_id, created_at desc);
create index if not exists idx_comments_parent   on public.comments (parent_id);

-- ----------------------------------------------------------------------------
-- 6. comment_reactions: anon_id 기반
-- ----------------------------------------------------------------------------
drop table if exists public.comment_reactions cascade;

create table public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  anon_id    text not null,
  reaction   reaction_kind not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, anon_id)
);

-- 반응 집계 trigger 재연결
drop trigger if exists trg_comment_reactions on public.comment_reactions;
create trigger trg_comment_reactions
  after insert or update or delete on public.comment_reactions
  for each row execute function public.update_comment_reaction_counts();

-- ----------------------------------------------------------------------------
-- 7. RLS: 전면 공개 CRUD (필요 시 나중에 rate limit 추가)
-- ----------------------------------------------------------------------------
alter table public.questions          enable row level security;
alter table public.votes              enable row level security;
alter table public.comments           enable row level security;
alter table public.comment_reactions  enable row level security;

-- questions
drop policy if exists "questions_read_approved" on public.questions;
drop policy if exists "questions_insert_auth"   on public.questions;
drop policy if exists "questions_update_admin"  on public.questions;
drop policy if exists "questions_read_public"   on public.questions;
drop policy if exists "questions_insert_public" on public.questions;

create policy "questions_read_public"   on public.questions for select using (status = 'approved');
create policy "questions_insert_public" on public.questions for insert with check (status = 'pending');
-- status 변경(승인/반려)은 SQL Editor 또는 service_role만 가능하도록 update policy는 안 만듦

-- votes
drop policy if exists "votes_read_all"        on public.votes;
drop policy if exists "votes_insert_public"   on public.votes;
drop policy if exists "votes_update_public"   on public.votes;
drop policy if exists "votes_delete_public"   on public.votes;

create policy "votes_read_all"      on public.votes for select using (true);
create policy "votes_insert_public" on public.votes for insert with check (true);
create policy "votes_update_public" on public.votes for update using (true);
create policy "votes_delete_public" on public.votes for delete using (true);

-- comments
drop policy if exists "comments_read_all"      on public.comments;
drop policy if exists "comments_insert_public" on public.comments;

create policy "comments_read_all"      on public.comments for select using (true);
create policy "comments_insert_public" on public.comments for insert with check (true);

-- comment_reactions
drop policy if exists "reactions_read_all"      on public.comment_reactions;
drop policy if exists "reactions_insert_public" on public.comment_reactions;
drop policy if exists "reactions_update_public" on public.comment_reactions;
drop policy if exists "reactions_delete_public" on public.comment_reactions;

create policy "reactions_read_all"      on public.comment_reactions for select using (true);
create policy "reactions_insert_public" on public.comment_reactions for insert with check (true);
create policy "reactions_update_public" on public.comment_reactions for update using (true);
create policy "reactions_delete_public" on public.comment_reactions for delete using (true);
