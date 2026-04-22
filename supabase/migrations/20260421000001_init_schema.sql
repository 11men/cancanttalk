-- ============================================================================
-- CanCantTalk 초기 스키마
-- 실행: Supabase Dashboard > SQL Editor 에 붙여넣기 또는 `supabase db push`
-- ============================================================================

-- extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. categories (테마)
-- ============================================================================
create table if not exists public.categories (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  emoji       text not null,
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 2. profiles (auth.users 1:1, 닉네임/타이틀/뱃지)
-- ============================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  nickname     text unique,
  title        text,                        -- '프로 덕후', '사회적 생존자' 등 성향 타이틀
  badge_count  int not null default 0,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- auth.users 생성 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 3. questions (시드 + UGC 통합)
-- ============================================================================
do $$ begin
  create type question_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.questions (
  id           uuid primary key default gen_random_uuid(),
  category_id  int not null references public.categories(id) on delete cascade,
  content      text not null check (char_length(content) between 5 and 300),
  author_id    uuid references public.profiles(id) on delete set null, -- null이면 공식 시드
  difficulty   smallint not null default 3 check (difficulty between 1 and 5),
  status       question_status not null default 'approved',
  vote_count   int not null default 0,
  yes_count    int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_questions_category_status on public.questions (category_id, status);
create index if not exists idx_questions_vote_count on public.questions (vote_count desc);

-- ============================================================================
-- 4. votes (1유저 1질문 1표)
-- ============================================================================
create table if not exists public.votes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  choice      boolean not null,            -- true=가능, false=불가
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists idx_votes_question on public.votes (question_id);

-- 투표 집계 trigger (denormalization 캐시 갱신)
create or replace function public.update_question_vote_counts()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.questions
    set vote_count = vote_count + 1,
        yes_count  = yes_count + (case when NEW.choice then 1 else 0 end)
    where id = NEW.question_id;
  elsif TG_OP = 'DELETE' then
    update public.questions
    set vote_count = vote_count - 1,
        yes_count  = yes_count - (case when OLD.choice then 1 else 0 end)
    where id = OLD.question_id;
  elsif TG_OP = 'UPDATE' and NEW.choice <> OLD.choice then
    update public.questions
    set yes_count = yes_count + (case when NEW.choice then 1 else -1 end)
    where id = NEW.question_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_votes_counts on public.votes;
create trigger trg_votes_counts
  after insert or update or delete on public.votes
  for each row execute function public.update_question_vote_counts();

-- ============================================================================
-- 5. comments
-- ============================================================================
create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.questions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 500),
  like_count    int not null default 0,
  dislike_count int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_comments_question on public.comments (question_id, created_at desc);

-- ============================================================================
-- 6. comment_reactions
-- ============================================================================
do $$ begin
  create type reaction_kind as enum ('like', 'dislike');
exception when duplicate_object then null;
end $$;

create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  reaction   reaction_kind not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- 댓글 반응 집계 trigger
create or replace function public.update_comment_reaction_counts()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.reaction = 'like' then
      update public.comments set like_count = like_count + 1 where id = NEW.comment_id;
    else
      update public.comments set dislike_count = dislike_count + 1 where id = NEW.comment_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.reaction = 'like' then
      update public.comments set like_count = like_count - 1 where id = OLD.comment_id;
    else
      update public.comments set dislike_count = dislike_count - 1 where id = OLD.comment_id;
    end if;
  elsif TG_OP = 'UPDATE' and NEW.reaction <> OLD.reaction then
    if NEW.reaction = 'like' then
      update public.comments set like_count = like_count + 1, dislike_count = dislike_count - 1 where id = NEW.comment_id;
    else
      update public.comments set like_count = like_count - 1, dislike_count = dislike_count + 1 where id = NEW.comment_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comment_reactions on public.comment_reactions;
create trigger trg_comment_reactions
  after insert or update or delete on public.comment_reactions
  for each row execute function public.update_comment_reaction_counts();

-- ============================================================================
-- RLS 정책
-- ============================================================================
alter table public.categories         enable row level security;
alter table public.profiles           enable row level security;
alter table public.questions          enable row level security;
alter table public.votes              enable row level security;
alter table public.comments           enable row level security;
alter table public.comment_reactions  enable row level security;

-- categories
drop policy if exists "categories_read_all"  on public.categories;
create policy "categories_read_all"  on public.categories  for select using (true);

-- profiles
drop policy if exists "profiles_read_all"    on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_read_all"    on public.profiles    for select using (true);
create policy "profiles_update_self" on public.profiles    for update using (auth.uid() = id) with check (auth.uid() = id);

-- questions
drop policy if exists "questions_read_approved" on public.questions;
drop policy if exists "questions_insert_auth"   on public.questions;
drop policy if exists "questions_update_admin"  on public.questions;
create policy "questions_read_approved" on public.questions
  for select using (status = 'approved' or author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "questions_insert_auth" on public.questions
  for insert with check (auth.uid() = author_id and status = 'pending');
create policy "questions_update_admin" on public.questions
  for update using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- votes
drop policy if exists "votes_read_all"    on public.votes;
drop policy if exists "votes_insert_self" on public.votes;
drop policy if exists "votes_update_self" on public.votes;
drop policy if exists "votes_delete_self" on public.votes;
create policy "votes_read_all"    on public.votes for select using (true);
create policy "votes_insert_self" on public.votes for insert with check (auth.uid() = user_id);
create policy "votes_update_self" on public.votes for update using (auth.uid() = user_id);
create policy "votes_delete_self" on public.votes for delete using (auth.uid() = user_id);

-- comments
drop policy if exists "comments_read_all"    on public.comments;
drop policy if exists "comments_insert_self" on public.comments;
drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_read_all"    on public.comments for select using (true);
create policy "comments_insert_self" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_self" on public.comments for delete using (auth.uid() = user_id);

-- comment_reactions
drop policy if exists "reactions_read_all"    on public.comment_reactions;
drop policy if exists "reactions_insert_self" on public.comment_reactions;
drop policy if exists "reactions_update_self" on public.comment_reactions;
drop policy if exists "reactions_delete_self" on public.comment_reactions;
create policy "reactions_read_all"    on public.comment_reactions for select using (true);
create policy "reactions_insert_self" on public.comment_reactions for insert with check (auth.uid() = user_id);
create policy "reactions_update_self" on public.comment_reactions for update using (auth.uid() = user_id);
create policy "reactions_delete_self" on public.comment_reactions for delete using (auth.uid() = user_id);
