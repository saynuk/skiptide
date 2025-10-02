# Calm Newspaper — MVP

A quiet, cross‑platform personal newspaper. Add creators (Substack, Ghost, Medium, Patreon, blogs), see headlines + blurbs in one calm feed, and click through to read on the original site.

This MVP uses **Next.js (Vercel)** + **Supabase (Postgres & Auth)**. No servers to manage.

---

## 0) What you need (accounts)
- A free **Vercel** account — hosts the app.
- A free **Supabase** account — database + login.

Optional later: Upstash Redis, Plausible, Sentry (not required for MVP).

---

## 1) Create the database (Supabase)
1. Go to https://supabase.com → Sign up → New project.
2. Give it a name. Choose the **Region** closest to you. Set a database password (save it).
3. When the project opens, copy these two values from **Project Settings → API**:
   - `Project URL` → your **NEXT_PUBLIC_SUPABASE_URL**
   - `anon public` key → your **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - `service_role` key → your **SUPABASE_SERVICE_ROLE_KEY** (keep private)
4. In the left sidebar, open **SQL Editor** → **New query** → paste the contents of `db/schema.sql` from this project → **Run**.

That creates all tables and security rules.

**Enable email sign-in:**
- In **Authentication → Providers**, ensure **Email** is enabled. Magic links are OK. Set a sender name/email in **SMTP** (or use Supabase’s default dev email).

---

## 2) Put the app code online (GitHub) and deploy on Vercel
1. Unzip this project locally.
2. Create a new **GitHub** repository (public is fine for MVP).
3. Upload all files to the repo (drag-and-drop on github.com works).
4. Go to https://vercel.com → **Add New… → Project** → **Import Git Repository** → select your new repo.
5. In the Vercel setup screen, add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = (from Supabase step 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase step 1)
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase step 1 — private)
6. Click **Deploy**. Wait for build to finish. Click **Visit**.

---

## 3) First run
1. Open your site URL.
2. Click **Login** → enter your email → click the magic link you receive.
3. Go to **Add source**:
   - Paste a creator’s page (e.g., a Substack homepage).
   - Click **Find feed**. If found, click **Follow**, then **Refresh now**.
4. Go back to **Home**. You should see the latest posts (title + excerpt).

**Note:** Some sources only expose short snippets. That’s expected. Clicking a post opens the original site; if you’re subscribed/logged in there, you’ll see the full article.

---

## 4) (Optional) Automatic refresh
This MVP includes a cron endpoint stub. If you want scheduled refreshing later:
- In Vercel → **Project → Settings → Cron Jobs**:
  - Add a job: `GET /api/cron/poll` every 30–60 minutes.
- The current cron route is a stub; for full auto-refresh, extend it to 1) list stale `sources` and 2) POST to `/api/worker/poll-source` for each one.

For now, the **Refresh now** button on the Add page triggers a poll for that source.

---

## 5) Common questions

**Q: Is my private Supabase key exposed?**  
A: The `SUPABASE_SERVICE_ROLE_KEY` lives on the server and is never sent to the browser. Route handlers run on the server. Don’t publish that key anywhere else.

**Q: Can other users see my data?**  
A: No. Row-Level Security policies ensure each user only sees their own subscriptions/read states.

**Q: Can we add tags, weekly digests, or offline mode?**  
A: Yes, but not included in this MVP to keep it simple.

---

## 6) Local development (optional)
If you want to run it on your computer:
1. Install Node.js 18+.
2. `npm install`
3. Create a `.env.local` file with the same three env vars from step 1.
4. `npm run dev` → open `http://localhost:3000`.

---

## 7) Safety & respect
- We only fetch **public** feeds and store headlines/excerpts with links.
- We do **not** bypass paywalls or store full paid content.
- We honor per-site rate limits and will add polite backoff in production.

Enjoy your calmer newspaper.
