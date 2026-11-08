-- Private file bucket and owner-only storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('personal-files', 'personal-files', false, 20971520, array['image/jpeg','image/png','image/webp','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = 20971520;

drop policy if exists "personal files read own" on storage.objects;
create policy "personal files read own" on storage.objects for select to authenticated using (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "personal files upload own" on storage.objects;
create policy "personal files upload own" on storage.objects for insert to authenticated with check (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "personal files update own" on storage.objects;
create policy "personal files update own" on storage.objects for update to authenticated using (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "personal files delete own" on storage.objects;
create policy "personal files delete own" on storage.objects for delete to authenticated using (bucket_id = 'personal-files' and (storage.foldername(name))[1] = auth.uid()::text);
