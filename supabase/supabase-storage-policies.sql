-- Create the storage bucket for user avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to view any avatar (since they are public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  storage.filename(name) = auth.uid() || '.' || storage.extension(name)
);

-- Allow users to update or replace their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  storage.filename(name) LIKE auth.uid() || '.%'
)
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  storage.filename(name) = auth.uid() || '.' || storage.extension(name)
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  storage.filename(name) LIKE auth.uid() || '.%'
); 