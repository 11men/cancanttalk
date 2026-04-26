-- ============================================================================
-- comments.is_best + admin-only BEST selection policy
-- moderation_blocks audit log (optional but useful for tuning the filter)
-- ============================================================================

alter table public.comments
  add column if not exists is_best boolean not null default false;

create index if not exists idx_comments_is_best
  on public.comments (question_id, is_best)
  where is_best;

-- Only admins can flip is_best. Everyone else is limited to their own comment
-- via the existing comments_delete_self; we add an UPDATE policy that ONLY
-- allows admins to modify the is_best column (or any column) on comments.
drop policy if exists "comments_update_admin_best" on public.comments;
create policy "comments_update_admin_best" on public.comments
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- ============================================================================
-- moderation_blocks: record each time client/server filter rejects content.
-- Lets us tune the badword list and spot abuse patterns without exposing
-- rejected content publicly.
-- ============================================================================

create table if not exists public.moderation_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  kind        text not null check (kind in ('comment', 'question')),
  content     text not null,
  reason      text not null,
  matched     text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_moderation_blocks_created
  on public.moderation_blocks (created_at desc);

alter table public.moderation_blocks enable row level security;

drop policy if exists "moderation_blocks_admin_read" on public.moderation_blocks;
drop policy if exists "moderation_blocks_system_insert" on public.moderation_blocks;

-- Only admins can read
create policy "moderation_blocks_admin_read" on public.moderation_blocks
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- Server actions write as the acting user; allow insert with user_id = auth.uid()
create policy "moderation_blocks_system_insert" on public.moderation_blocks
  for insert with check (user_id = auth.uid() or user_id is null);
