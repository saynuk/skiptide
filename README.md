# Skiptide

A quiet, personal newspaper for the writers you choose.

---

## Setup Guide

This takes about 20–30 minutes. You'll need:
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- [Node.js](https://nodejs.org) installed on your computer (v18 or later)
- A [GitHub](https://github.com) account (free — Vercel deploys from GitHub)

---

### Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Name it `skiptide`, choose a region close to you, set a database password (save it somewhere)
4. Wait ~2 minutes for it to spin up

### Step 2 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase-schema.sql` from this project
4. Copy the entire contents and paste it into the SQL editor
5. Click **Run** — you should see "Success. No rows returned"

### Step 3 — Get your Supabase credentials

1. In Supabase, go to **Settings > API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### Step 4 — Set up the project locally

```bash
# In your terminal, navigate to the skiptide folder
cd skiptide

# Install dependencies
npm install

# Create your local environment file
cp .env.example .env.local
```

Open `.env.local` and fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=make-up-any-random-string-here
```

### Step 5 — Configure Supabase auth

1. In Supabase, go to **Authentication > URL Configuration**
2. Set **Site URL** to `http://localhost:3000` (for now)
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`

### Step 6 — Test it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Skiptide login page.

Try signing in with your email — you'll get a magic link in your inbox.

---

### Step 7 — Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click **New Project**
3. Import your GitHub repository
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
   - `NEXT_PUBLIC_SITE_URL` — your Vercel app URL (e.g. `https://skiptide.vercel.app`)
   - `CRON_SECRET` — same random string you used locally
5. Click **Deploy**

### Step 8 — Update Supabase auth for production

1. In Supabase, go to **Authentication > URL Configuration**
2. Update **Site URL** to your Vercel URL (e.g. `https://skiptide.vercel.app`)
3. Add to **Redirect URLs**: `https://skiptide.vercel.app/auth/callback`

---

## How the cron job works

Vercel automatically calls `/api/cron/refresh-feeds` every 30 minutes (configured in `vercel.json`). This fetches new posts from all sources. The `CRON_SECRET` environment variable protects this endpoint so only Vercel can trigger it.

---

## Project structure

```
skiptide/
├── app/
│   ├── api/
│   │   ├── sources/         # Add/remove writers
│   │   ├── posts/read/      # Mark posts as read
│   │   └── cron/            # Feed refresh job
│   ├── auth/callback/       # Magic link handler
│   ├── dashboard/           # Main feed page
│   └── login/               # Login page
├── components/
│   ├── Feed.tsx             # Main feed UI
│   └── AddWriterModal.tsx   # Add writer dialog
├── lib/
│   ├── feed.ts              # RSS discovery + parsing
│   └── supabase/            # Supabase clients
├── supabase-schema.sql      # Run this once in Supabase
└── vercel.json              # Cron schedule
```
