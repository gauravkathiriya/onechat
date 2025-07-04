# Setting up Supabase Storage for OneChat

Follow these instructions to properly configure the storage for user avatars in your Supabase project.

## 1. Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to "Storage" in the left sidebar
3. Click "Create bucket"
4. Enter the name as `user-avatars`
5. Check "Public bucket" to make avatars publicly accessible
6. Click "Create bucket"

## 2. Set Up Storage Policies

You can either run the SQL commands directly in the SQL Editor or create the policies through the UI.

### Option 1: Using SQL (Recommended)

1. Go to "SQL Editor" in the Supabase dashboard
2. Create a new query
3. Copy and paste the SQL from `supabase-storage-policies.sql` file
4. Run the query

### Option 2: Using UI

1. Go to "Storage" in the Supabase dashboard
2. Select the `user-avatars` bucket
3. Go to the "Policies" tab
4. Create the following policies:

#### Policy 1: Allow public access to view avatars
- Policy name: "Anyone can view avatars"
- For operation: SELECT
- Policy definition: `bucket_id = 'user-avatars'`

#### Policy 2: Allow users to upload their own avatar
- Policy name: "Users can upload their own avatar"
- For operation: INSERT
- Policy definition: `bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars' AND storage.filename(name) = auth.uid() || '.' || storage.extension(name)`

#### Policy 3: Allow users to update their own avatar
- Policy name: "Users can update their own avatar"
- For operation: UPDATE
- Policy definition: `bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars' AND storage.filename(name) LIKE auth.uid() || '.%'`
- Using expression: Same as Policy 2

#### Policy 4: Allow users to delete their own avatar
- Policy name: "Users can delete their own avatar"
- For operation: DELETE
- Policy definition: `bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars' AND storage.filename(name) LIKE auth.uid() || '.%'`

## 3. Create 'avatars' Folder

1. Go to "Storage" in the Supabase dashboard
2. Select the `user-avatars` bucket
3. Click "Create folder" 
4. Name it `avatars`
5. Click "Create"

## Troubleshooting

If you encounter permission errors when uploading avatars:

1. Check that the bucket exists and is named exactly `user-avatars`
2. Verify all storage policies have been created correctly
3. Make sure the `avatars` folder exists in the bucket
4. Check that the user is authenticated when uploading
5. Check the browser console for specific error messages 