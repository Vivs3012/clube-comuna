-- Shared film and series recommendations for the Clube Comuna media room.
create table if not exists public.club_media_recommendations (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  kind text not null check (kind in ('film', 'series')),
  release_year integer check (release_year is null or release_year between 1888 and 2100),
  genre text not null default '' check (char_length(genre) <= 120),
  description text not null default '' check (char_length(description) <= 1200),
  poster_url text check (poster_url is null or poster_url ~* '^https?://'),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  recommended_by uuid not null references public.club_profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.club_media_recommendations enable row level security;
revoke all on table public.club_media_recommendations from public, anon, authenticated;
grant select on table public.club_media_recommendations to anon, authenticated;
grant insert (title, kind, release_year, genre, description, poster_url, source_url, recommended_by)
  on public.club_media_recommendations to authenticated;
grant delete on public.club_media_recommendations to authenticated;

drop policy if exists "Anyone can view media recommendations" on public.club_media_recommendations;
create policy "Anyone can view media recommendations"
on public.club_media_recommendations for select to anon, authenticated
using (true);

drop policy if exists "Active members can add media recommendations" on public.club_media_recommendations;
create policy "Active members can add media recommendations"
on public.club_media_recommendations for insert to authenticated
with check (
  recommended_by = (select auth.uid())
  and exists (
    select 1 from public.club_profiles p
    where p.id = (select auth.uid()) and p.is_active
  )
);

drop policy if exists "Authors and admins can remove media recommendations" on public.club_media_recommendations;
create policy "Authors and admins can remove media recommendations"
on public.club_media_recommendations for delete to authenticated
using (recommended_by = (select auth.uid()) or (select public.is_club_admin()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'club_media_recommendations'
  ) then
    alter publication supabase_realtime add table public.club_media_recommendations;
  end if;
end;
$$;
