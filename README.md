# OneChat - Real-time Chat Application

A modern real-time chat application built with Next.js and Supabase.

## Features

- 🔐 **User Authentication**
  - Login/Signup via Supabase Auth
  - Secure session management
  - Profile setup with display name and avatar

- 💬 **Real-time Messaging**
  - Global chat room for all users
  - Messages delivered instantly with Supabase Realtime
  - Auto-scroll to latest messages

- 👤 **User Profiles**
  - Custom display names
  - Profile pictures (uploaded to Supabase Storage)
  - User avatars shown with messages

- 😀 **Emoji Support**
  - Add emojis to messages with an emoji picker

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Styling**: shadcn/ui components

## Setup

### Prerequisites

- Node.js (v18 or newer)
- Supabase account and project

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL commands in `supabase-setup.sql` in the Supabase SQL editor
3. Enable Email Auth in Authentication settings
4. Create a storage bucket named `user-avatars` with public access

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Application Flow

1. Users sign up or log in
2. First-time users complete their profile setup
3. After authentication, users are redirected to the chat page
4. Messages are delivered in real-time to all connected users

## License

MIT

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
