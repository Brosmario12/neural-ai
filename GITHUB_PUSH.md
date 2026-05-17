# Push to GitHub

Your code is ready to push. Follow these steps:

## Option 1: Using Dyad (Recommended)

1. Open Dyad
2. Click "Git" → "New Repository"
3. Enter: `https://github.com/YOUR_USERNAME/neural-ai.git`
4. Click "Create" (it will create the repo automatically)
5. Select this folder and import
6. Dyad will push automatically

## Option 2: Using Git CLI

### Step 1: Create Repository on GitHub

Go to https://github.com/new and create:
- **Repository name**: `neural-ai`
- **Description**: "Conversational AI assistant with Supabase and Claude"
- **Public** (or Private if preferred)
- **Skip** initializing with README
- Click **Create repository**

### Step 2: Push Code

```bash
cd neural-ai

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/neural-ai.git

# Rename branch to main (optional but recommended)
git branch -M main

# Push
git push -u origin main
```

### Step 3: Verify

Go to `https://github.com/YOUR_USERNAME/neural-ai` and confirm code is there.

---

## After Push

1. ✅ Code is on GitHub
2. ✅ Ready for Vercel deployment
3. ✅ Version control is live

Next: Proceed to Vercel deployment (see `DEPLOYMENT.md`)
