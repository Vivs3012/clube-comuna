-- Let members revise their own recommendations and upload film/series posters.

revoke update (sort_order) on public.club_books from authenticated;
grant update (details) on public.club_books to authenticated;

drop policy if exists "Authors and admins can edit suggested books" on public.club_books;
create policy "Authors and admins can edit suggested books"
on public.club_books for update to authenticated
using (suggested_by = (select auth.uid()) or (select public.is_club_admin()))
with check (suggested_by = (select auth.uid()) or (select public.is_club_admin()));

grant update (title, kind, release_year, genre, description, poster_url, source_url)
  on public.club_media_recommendations to authenticated;

drop policy if exists "Authors and admins can edit media recommendations" on public.club_media_recommendations;
create policy "Authors and admins can edit media recommendations"
on public.club_media_recommendations for update to authenticated
using (recommended_by = (select auth.uid()) or (select public.is_club_admin()))
with check (recommended_by = (select auth.uid()) or (select public.is_club_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-media-posters', 'club-media-posters', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view media posters" on storage.objects;
create policy "Public can view media posters"
on storage.objects for select to anon, authenticated
using (bucket_id = 'club-media-posters');

drop policy if exists "Members can upload their own media posters" on storage.objects;
create policy "Members can upload their own media posters"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'club-media-posters'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.club_profiles p where p.id = (select auth.uid()) and p.is_active)
);

drop policy if exists "Members can delete their own media posters" on storage.objects;
create policy "Members can delete their own media posters"
on storage.objects for delete to authenticated
using (bucket_id = 'club-media-posters' and (storage.foldername(name))[1] = (select auth.uid())::text);
