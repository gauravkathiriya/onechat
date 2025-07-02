-- Create Storage Bucket for user avatars
-- Note: Run this first and make sure you have the right permissions
insert into storage.buckets (id, name, public) values ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - these may need to be run with storage admin permissions
-- If you encounter permission errors, you might need to use the Supabase Dashboard to create these policies

-- Allow public access to user avatars
begin;
  drop policy if exists "Public Access to User Avatars" on storage.objects;
  
  create policy "Public Access to User Avatars"
    on storage.objects for select
    using (bucket_id = 'user-avatars');
commit;

-- Allow users to upload their own avatar
begin;
  drop policy if exists "Users can upload their own avatar" on storage.objects;
  
  create policy "Users can upload their own avatar"
    on storage.objects for insert
    with check (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
commit;

-- Allow users to update their own avatar
begin;
  drop policy if exists "Users can update their own avatar" on storage.objects;
  
  create policy "Users can update their own avatar"
    on storage.objects for update
    using (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
commit;

-- Allow users to delete their own avatar
begin;
  drop policy if exists "Users can delete their own avatar" on storage.objects;
  
  create policy "Users can delete their own avatar"
    on storage.objects for delete
    using (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
commit; 