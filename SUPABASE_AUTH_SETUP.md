# Supabase Authentication Setup

## Quick Start

### 1. Run Database Migration

In your Supabase Dashboard:

1. Go to **SQL Editor**
2. Create **New Query**
3. Copy the entire content from `supabase/migrations/001_create_tables.sql`
4. Click **Run**
5. Wait for it to complete ✓

### 2. Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Find **Email**
3. Toggle **Enable Email provider** to ON
4. Click **Save**

### 3. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
```

Find them:
- **NEXT_PUBLIC_SUPABASE_URL**: "Project URL" field
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: "anon public" key
- **SUPABASE_SERVICE_KEY**: "service_role" key (scroll down)

### 4. Enable RLS (Row Level Security)

This is already configured in the SQL migration. After running the migration:

1. Go to **Database** → **Tables**
2. Click on `chat_sessions` table
3. Verify **RLS is enabled** (you should see a lock icon)
4. Do the same for `messages` table

### 5. Test Authentication

1. In your app, navigate to `/auth`
2. Sign up with an email (any email is fine)
3. You should now be logged in and able to chat

---

## What Was Set Up

✓ `chat_sessions` table - stores chat conversations
✓ `messages` table - stores individual messages
✓ RLS Policies - users can only see/edit their own data
✓ Automatic timestamps - messages are timestamped
✓ Cascade deletes - deleting a session deletes its messages
✓ Auth integration - sessions/messages linked to auth.users

---

## Troubleshooting

**"Auth error: No user logged in"**
→ Make sure you signed up on `/auth` page

**"RLS policy violation"**
→ Run the SQL migration again, might be incomplete

**"Anon key doesn't have permission"**
→ The API calls in `/api/chat` use the SERVICE_KEY (has full access)
→ The client calls use the ANON_KEY (limited by RLS)

---

## Production Notes

- RLS policies are strict - users can ONLY see their own data
- Service key is used server-side only (in API routes) - never expose to client
- Email verification can be enabled later for production
- You can add OAuth providers (Google, GitHub) anytime
