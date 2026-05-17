# Deployment Guide

## Step 1: Prepare Environment Variables

Create `.env.local` in the `neural-ai/` folder:

```bash
cp .env.example .env.local
```

Fill in your actual keys:
- Supabase URL and keys (from Settings → API)
- Anthropic API key (from console.anthropic.com)

## Step 2: Test Locally

```bash
npm install
npm run dev
```

Navigate to:
- `http://localhost:3000` → Should redirect to `/auth`
- `http://localhost:3000/auth` → Sign up / Sign in
- Chat should work and save messages to Supabase

## Step 3: Push to GitHub

```bash
# From neural-ai folder
git init
git add .
git commit -m "feat: neural-ai - conversational AI with auth and Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neural-ai.git
git push -u origin main
```

## Step 4: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts, add environment variables when asked.

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `ANTHROPIC_API_KEY`
5. Click "Deploy"

### Option C: Auto-Deploy from GitHub (Recommended)

1. Create new Vercel project from GitHub
2. Select the repo with neural-ai code
3. Add env vars in Vercel dashboard
4. Every `git push` to main automatically deploys

## Step 5: Verify Deployment

After deployment completes:

1. Visit your Vercel URL
2. Sign up with a test email
3. Send a message
4. Check Supabase → Table Editor → messages table
5. Verify your message appears there

## Troubleshooting

**"API error" when sending messages**
→ Check `ANTHROPIC_API_KEY` is set correctly in Vercel env

**"RLS policy violation"**
→ Check `SUPABASE_SERVICE_KEY` is set in Vercel env

**Build fails**
→ Run `npm run build` locally to test
→ Check all TypeScript errors with `npm run typecheck`

**Redirects to /auth loop**
→ Clear browser cookies
→ Try incognito/private window

## Environment Variables Reference

| Variable | Where to Get | Used By |
|----------|-------------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Settings → API → Project URL | Frontend + Backend |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Settings → API → anon public | Frontend |
| SUPABASE_SERVICE_KEY | Supabase Settings → API → service_role | Backend only (API routes) |
| ANTHROPIC_API_KEY | console.anthropic.com → API Keys | Backend (API routes) |

## Post-Deployment

- Monitor logs: Vercel Dashboard → Deployments → Function Logs
- Check database: Supabase Dashboard → Table Editor
- Setup monitoring: Add Vercel analytics
- Enable email verification for production (Supabase → Auth → Providers)
