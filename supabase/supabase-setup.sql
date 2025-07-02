-- We don't need to modify auth.users table as it's managed by Supabase
-- This line was causing the error: alter table auth.users enable row level security;

-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_seen timestamp with time zone default now()
);

-- Create index for faster profile lookups
create index on public.profiles(email);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create profiles for existing users
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile when a user signs up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Automatically update updated_at when profile is modified
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update updated_at when profile changes
create or replace trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create policy to allow users to view their own profile
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Create policy to allow users to update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create policy to allow users to see other users' basic profiles
create policy "Users can view other users basic profiles"
  on public.profiles for select
  using (true);

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default now() not null,
  is_edited boolean default false,
  edited_at timestamp with time zone
);

-- Create index for faster message retrieval
create index on public.messages(created_at desc);
create index on public.messages(user_id);

-- Enable RLS on messages
alter table public.messages enable row level security;

-- Create policy to allow users to insert their own messages
create policy "Users can insert their own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own messages
create policy "Users can update their own messages"
  on public.messages for update
  using (auth.uid() = user_id);

-- Create policy to allow everyone to view all messages
create policy "Everyone can view all messages"
  on public.messages for select
  using (true);

-- Create function to update message and set it as edited
create or replace function public.update_message(message_id uuid, new_content text)
returns boolean as $$
declare
  message_user_id uuid;
begin
  -- Get the user_id of the message
  select user_id into message_user_id from public.messages where id = message_id;
  
  -- Check if the user is the owner of the message
  if message_user_id = auth.uid() then
    update public.messages
    set 
      content = new_content,
      is_edited = true,
      edited_at = now()
    where id = message_id;
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;

-- Function to update last_seen timestamp for users
create or replace function public.update_last_seen()
returns trigger as $$
begin
  update public.profiles
  set last_seen = now()
  where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update last_seen when a user sends a message
create trigger on_message_sent
  after insert on public.messages
  for each row execute procedure public.update_last_seen();

-- Enable realtime for both profiles and messages tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.profiles (id, display_name, avatar_url, last_seen); 