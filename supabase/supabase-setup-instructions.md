# Supabase Setup Instructions for OneChat

This document provides step-by-step instructions to set up your Supabase project for the OneChat application.

## Setup Steps

### 1. Create a New Supabase Project

1. Go to [https://app.supabase.io/](https://app.supabase.io/)
2. Create a new project and note your project URL and anon key

### 2. Run the Main Database Setup

1. Navigate to the SQL Editor in your Supabase dashboard
2. Open the `supabase-setup.sql` file
3. Execute the SQL commands in the SQL Editor

This script will:
- Create the profiles table
- Set up triggers for user creation and profile updates
- Create the messages table with proper indexes
- Configure Row Level Security (RLS) policies
- Set up realtime subscriptions

### 3. Set Up Storage for Avatars

To set up storage for user avatars, you have two options:

#### Option A: Using the Supabase Dashboard (Recommended)

1. Go to the Storage section in your Supabase dashboard
2. Create a new bucket named `user-avatars`
3. Check the "Public bucket" option
4. Go to the "Policies" tab and create the following policies:
   - Select: Allow public access to user avatars
   - Insert: Allow users to upload their own avatar (use the formula: `(storage.foldername(name))[1] = auth.uid()::text`)
   - Update: Allow users to update their own avatar (use the same formula as Insert)
   - Delete: Allow users to delete their own avatar (use the same formula as Insert)

#### Option B: Using SQL (May Require Admin Permissions)

If you have admin permissions, you can run the SQL commands in `supabase-storage-policies.sql`:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Open the `supabase-storage-policies.sql` file
3. Execute the SQL commands

**Note:** If you encounter permission errors when running these commands, use Option A instead.

### 4. Enable Email Authentication

1. Go to the Authentication section in your Supabase dashboard
2. Navigate to "Providers"
3. Enable "Email" authentication
4. Configure any other settings as needed (confirm emails, etc.)

### 5. Enable Realtime

1. Go to the Database section in your Supabase dashboard
2. Navigate to "Replication"
3. Make sure the publication `supabase_realtime` exists and includes the tables:
   - `public.messages`
   - `public.profiles` (with columns: id, display_name, avatar_url, last_seen)

### 6. Configure Your Application

Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Permission Errors

If you encounter errors like `ERROR: 42501: must be owner of table users`:

- This is normal as you cannot modify system tables like `auth.users`
- The updated scripts should avoid this issue
- If you still see permission errors, try:
  1. Using the Supabase Dashboard UI to make the changes instead of SQL
  2. Contacting Supabase support if you need to perform specific operations

### Storage Policy Issues

If storage policies don't work as expected:

1. Check that your bucket is properly created and set to public
2. Verify your policy definitions using the Dashboard UI
3. Make sure your folder structure follows the pattern: `avatars/[user_id].[extension]` 