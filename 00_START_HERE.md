# 🚀 START HERE - Neural AI

**Status: READY FOR DEPLOYMENT** ✅

Everything is built and ready. Follow these 3 phases to launch.

---

## ⏱️ Time Required: ~30 minutes total

```
Phase 1: Local Setup      → 15 min
Phase 2: GitHub Push      → 5 min  
Phase 3: Vercel Deploy    → 10 min
```

---

## Phase 1: Local Setup (15 minutes)

### Step 1: Create `.env.local`

In the `neural-ai/` folder, create a file called `.env.local`:

```bash
# Copy from .env.example and fill in:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-v0-...
```

**Where to get each:**
- **Supabase URL & Keys**: https://app.supabase.com → your-project → Settings → API
- **Anthropic Key**: https://console.anthropic.com → API Keys → Create

### Step 2: Setup Supabase Database

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy entire content from `supabase/migrations/001_create_tables.sql`
5. Paste and click **Run**
6. ✓ Done! (You now have `chat_sessions` and `messages` tables)

### Step 3: Enable Email Authentication

1. In Supabase: **Authentication** → **Providers**
2. Find **Email**
3. Toggle **Enable Email provider** = ON
4. Click **Save**

### Step 4: Test Locally

```bash
npm install
npm run dev
```

Then open: http://localhost:3000

- Should redirect to `/auth`
- Sign up with any email
- Should be logged in
- Send a message
- Claude should reply
- Check Supabase → Table Editor → `messages` table (message should appear)

---

## Phase 2: GitHub Push (5 minutes)

### Option A: Using Dyad (Recommended)

1. Open Dyad
2. Click **Git** → **Create Repository**
3. Enter repo name: `neural-ai`
4. Make it **Public**
5. Dyad handles GitHub creation and push automatically

### Option B: Using PowerShell Script

```powershell
cd neural-ai
.\push-to-github.ps1
```

Then enter your GitHub username when prompted.

### Option C: Manual Git

1. Create repo at https://github.com/new
   - Name: `neural-ai`
   - Public
   - Skip README
   - Create

2. Run:
```bash
cd neural-ai
git remote add origin https://github.com/YOUR_USERNAME/neural-ai.git
git branch -M main
git push -u origin main
```

**Copy your repo URL**: `https://github.com/YOUR_USERNAME/neural-ai.git`

---

## Phase 3: Vercel Deploy (10 minutes)

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Find and select `neural-ai` from GitHub
5. Click **Import**

6. **Add Environment Variables** (very important!):
   ```
   NEXT_PUBLIC_SUPABASE_URL     = [from Supabase API settings]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [from Supabase API settings]
   SUPABASE_SERVICE_KEY         = [from Supabase API settings]
   ANTHROPIC_API_KEY            = [from Anthropic console]
   ```

7. Click **Deploy**
8. Wait 2-3 minutes
9. Vercel gives you a URL like: `https://neural-ai-username.vercel.app`

**Done!** Your app is live.

---

## After Deployment

✅ Verify it works:
- Visit your Vercel URL
- Sign up
- Send a message
- Check Supabase (message should appear)

✅ Monitor:
- Vercel Dashboard → Deployments → Function Logs
- Supabase Dashboard → Table Editor → messages

✅ Updates:
- Push to GitHub `main` branch
- Vercel auto-deploys
- Takes 1-2 minutes

---

## 📁 File Structure

```
neural-ai/
├── app/                    ← Pages & API
│   ├── page.tsx           ← Chat (protected)
│   ├── auth/page.tsx      ← Login/signup
│   ├── api/chat/route.ts  ← Claude API
│   └── layout.tsx         ← Root layout
├── components/            ← React components
├── lib/                   ← Utilities & Supabase
├── supabase/migrations/   ← Database schema
├── package.json           ← Dependencies
├── .env.example           ← Variable template
├── .env.local             ← ⬅️ YOU CREATE THIS
├── vercel.json            ← Deployment config
└── 00_START_HERE.md       ← You are here
```

---

## 🆘 Quick Help

**"I need to change something"**
→ Edit files locally → `npm run dev` to test → Push to GitHub → Vercel auto-deploys

**"Local dev works but Vercel shows 500 error"**
→ Check Vercel env vars are exactly right
→ Check Function Logs in Vercel dashboard
→ Verify API keys are valid

**"Can't log in"**
→ Make sure Supabase Email auth is enabled
→ Check auth provider is ON
→ Clear browser cookies

**"Messages not saving to database"**
→ Verify RLS migrations ran (should see tables in Supabase)
→ Check SUPABASE_SERVICE_KEY is in Vercel
→ Must be logged in to save messages

---

## 📚 Detailed Docs

- `README.md` - Technical overview
- `SETUP_GUIDE.md` - What was built
- `SUPABASE_AUTH_SETUP.md` - Supabase details
- `DEPLOYMENT.md` - Vercel details
- `GITHUB_PUSH.md` - GitHub details

---

## ✨ What You Have

- ✅ Modern chat interface (React 19 + Tailwind)
- ✅ AI responses (Claude 3.5 Sonnet)
- ✅ User authentication (Supabase Auth)
- ✅ Persistent storage (Supabase DB)
- ✅ Production ready (Vercel)
- ✅ Full type safety (TypeScript)
- ✅ Zero friction (auto-deploy from Git)

---

## 🎯 Next Step

1. Create `.env.local` with 4 variables
2. Run `npm install && npm run dev`
3. Test at http://localhost:3000
4. Push to GitHub
5. Deploy on Vercel

You're ready! 🚀
