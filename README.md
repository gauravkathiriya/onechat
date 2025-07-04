# OneChat

A modern real-time chat application built with Next.js, Supabase, and Tailwind CSS.

## Features

- Real-time messaging
- User authentication
- User profiles with avatars
- Theme customization (light/dark mode)
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/onechat.git
cd onechat
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Copy the `env.example` file to `.env.local` and add your Supabase credentials:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase URL and anon key.

4. Run the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Supabase Setup

Follow the instructions in the `supabase` folder to set up your Supabase project:

- `supabase-setup.sql`: SQL for creating tables and functions
- `supabase-setup-instructions.md`: Step-by-step guide
- `supabase-storage-policies.sql`: Storage bucket setup for avatars
- `storage-setup-instructions.md`: Storage setup guide

## Deploying to Vercel

See the detailed deployment guide in [deployment-guide.md](deployment-guide.md) for step-by-step instructions on deploying to Vercel.

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn UI](https://ui.shadcn.com/) - UI component library

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
