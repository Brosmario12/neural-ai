# Neural AI - Intelligent Conversational Assistant

A modern, clean AI chat application built with Next.js, Claude AI, and Supabase.

## Features

- 🧠 Intelligent conversation powered by Claude 3.5 Sonnet
- 💾 Persistent chat history with Supabase
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Real-time message streaming
- 🔐 Secure API integration

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Anthropic Claude API
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- npm or yarn
- Accounts for:
  - Supabase
  - Anthropic (Claude API)
  - Vercel (for deployment)

## Setup

### 1. Clone and Install

```bash
cd neural-ai
npm install
```

### 2. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Database Setup

1. Go to Supabase dashboard
2. Create a new database
3. Run the migration SQL from `supabase/migrations/001_create_tables.sql`

### 4. Run Development

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
neural-ai/
├── app/
│   ├── api/chat/route.ts        # Chat API endpoint
│   ├── page.tsx                 # Main page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ChatInterface.tsx        # Main chat component
│   ├── MessageList.tsx          # Message display
│   └── InputBar.tsx             # Message input
├── lib/
│   ├── types.ts                 # TypeScript types
│   └── supabase.ts              # Supabase client
└── supabase/
    └── migrations/              # Database migrations
```

## Next Steps

- [ ] Add message persistence to Supabase
- [ ] Implement chat sessions management
- [ ] Add user authentication
- [ ] Enable real-time message streaming
- [ ] Add export chat as PDF
- [ ] Deploy to Vercel

## Deployment

```bash
npm run build
npm start
```

For Vercel:
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy
