# Chat Requests Setup

The chat request system has been implemented but requires database setup to work properly.

## Quick Setup

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the following SQL code:**

```sql
-- Create chat_requests table
create table public.chat_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'ignored')),
  created_at timestamp with time zone default now() not null,
  responded_at timestamp with time zone,
  message text -- Optional message from requester
);

-- Create indexes for faster lookups
create index on public.chat_requests(recipient_id);
create index on public.chat_requests(requester_id);
create index on public.chat_requests(status);
create index on public.chat_requests(created_at desc);

-- Enable RLS on chat_requests
alter table public.chat_requests enable row level security;

-- Create policy to allow users to view chat requests sent to them
create policy "Users can view chat requests sent to them"
  on public.chat_requests for select
  using (auth.uid() = recipient_id);

-- Create policy to allow users to view chat requests they sent
create policy "Users can view chat requests they sent"
  on public.chat_requests for select
  using (auth.uid() = requester_id);

-- Create policy to allow users to create chat requests
create policy "Users can create chat requests"
  on public.chat_requests for insert
  with check (auth.uid() = requester_id);

-- Create policy to allow users to update chat requests they received
create policy "Users can update chat requests they received"
  on public.chat_requests for update
  using (auth.uid() = recipient_id);

-- Function to create conversation when chat request is accepted
create or replace function public.accept_chat_request(request_id uuid)
returns uuid as $$
declare
  request_record public.chat_requests%rowtype;
  conversation_id uuid;
  new_conversation_id uuid;
begin
  -- Get the chat request
  select * into request_record from public.chat_requests where id = request_id;
  
  -- Check if the current user is the recipient
  if request_record.recipient_id != auth.uid() then
    raise exception 'You can only accept chat requests sent to you';
  end if;
  
  -- Check if request is still pending
  if request_record.status != 'pending' then
    raise exception 'This chat request has already been responded to';
  end if;
  
  -- Check if conversation already exists
  select id into conversation_id from public.conversations
  where participant_ids @> array[request_record.requester_id, request_record.recipient_id]
  limit 1;
  
  -- If conversation doesn't exist, create it
  if conversation_id is null then
    insert into public.conversations (created_by, participant_ids)
    values (request_record.requester_id, array[request_record.requester_id, request_record.recipient_id])
    returning id into new_conversation_id;
    
    -- Add participants to the conversation
    insert into public.conversation_participants (conversation_id, user_id)
    values 
      (new_conversation_id, request_record.requester_id),
      (new_conversation_id, request_record.recipient_id);
    
    conversation_id := new_conversation_id;
  end if;
  
  -- Update the chat request status
  update public.chat_requests
  set status = 'accepted', responded_at = now()
  where id = request_id;
  
  return conversation_id;
end;
$$ language plpgsql security definer;

-- Function to ignore chat request
create or replace function public.ignore_chat_request(request_id uuid)
returns boolean as $$
declare
  request_record public.chat_requests%rowtype;
begin
  -- Get the chat request
  select * into request_record from public.chat_requests where id = request_id;
  
  -- Check if the current user is the recipient
  if request_record.recipient_id != auth.uid() then
    raise exception 'You can only ignore chat requests sent to you';
  end if;
  
  -- Check if request is still pending
  if request_record.status != 'pending' then
    raise exception 'This chat request has already been responded to';
  end if;
  
  -- Update the chat request status
  update public.chat_requests
  set status = 'ignored', responded_at = now()
  where id = request_id;
  
  return true;
end;
$$ language plpgsql security definer;

-- Enable realtime for chat_requests table
alter publication supabase_realtime add table public.chat_requests;
```

4. **Click "Run" to execute the SQL**

## How It Works

- **Before Setup**: Users can still start chats normally (direct conversations)
- **After Setup**: Users send chat requests that recipients must accept
- **Real-time**: Recipients get instant popup notifications
- **Security**: Only recipients can accept/ignore their requests

## Testing

1. Set up the database (run the SQL above)
2. Open the app in two different browsers/incognito windows
3. Sign in with different accounts
4. Try to start a chat from one account
5. The other account should see a popup notification

The infinite loop error should now be fixed, and the app will work gracefully even before the database setup is complete.
