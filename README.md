# Unplug

A personal digital-detox companion app for university students. Set a daily
social-media limit, log your usage, keep a streak, and grow a companion
(plant / animal / character) that levels up permanently as you earn and
spend points.

Built with Next.js 14 (App Router), Supabase (Postgres + Auth), and Tailwind CSS.

## How the mechanics work

**Daily log** — each day you log your hours against your goal. It's binary —
only meeting the goal keeps the streak alive:

| Condition | Streak | Points |
|---|---|---|
| Hours ≤ goal | +1 | Full (scaled by % under goal: 10%→10pts, 50%→50pts, 0h→150pts) |
| Hours > goal | −1 (floor 0) | 0 |

**Companion health** (day-to-day, recoverable) — healthy after a beat day,
neutral after a single drop, critical after two+ drops in a row.

**Companion level** (permanent) — spend points in the food shop (Apple 30pts,
Smoothie 80pts, Cake 150pts) to earn XP. Baby → Growing (200xp) → Mature (600xp).

All of this logic lives in Postgres (`supabase/migrations/`, functions
`submit_daily_log` and `spend_points_on_food`) so it's atomic and
authoritative — the client never computes streak/points itself.

## Local development

Requires Docker (for the local Supabase stack) and Node 18+.

```bash
npm install

# Start local Supabase (Postgres, Auth, Studio) — applies supabase/migrations automatically
npx supabase start

# Copy the ANON_KEY / API_URL printed by `supabase start` into .env.local
cp .env.local.example .env.local   # then fill in the values

npm run dev
```

Open http://localhost:3000 — you'll be routed to `/login`, then `/onboarding`
after signing up. Supabase Studio (useful for inspecting data) runs at
http://127.0.0.1:54323.

If you change `supabase/migrations/0001_init.sql`, apply it with:

```bash
npx supabase db reset          # re-applies all migrations from scratch
npx supabase gen types typescript --local > lib/database.types.ts
```

## Deploying

### 1. Hosted Supabase project (real database)

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough to start).
2. Link this repo to it and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>   # ref is in the project's dashboard URL
   npx supabase db push                                  # applies supabase/migrations/0001_init.sql
   ```
3. Grab the URL + anon key from **Project Settings → API** — you'll need them in step 2 below.
4. In **Authentication → URL Configuration**, set the Site URL and add a Redirect URL for your
   production domain (e.g. `https://your-app.vercel.app`) — signups/logins will fail without this.
5. Decide on **Authentication → Providers → Email → Confirm email**: local dev has this off for
   convenience; for production you likely want it **on** so people confirm real addresses.

### 2. Deploy to Vercel

1. Push this repo to GitHub (`git add`, `git commit`, `git push` to a new repo — not done for you,
   since it's your repo/account).
2. Import it at [vercel.com/new](https://vercel.com/new) (or `npx vercel` from the CLI).
3. Add these environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL` — from step 1.3
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from step 1.3
   - `ANTHROPIC_API_KEY` — same one from `.env.local`, for screenshot scanning
4. Deploy. Once it's live, sign up on the production URL once to confirm auth + the daily-log RPCs
   work end to end against the real database.

### Notes

- The local Supabase stack (`supabase start`) is dev-only — it doesn't share data with the hosted
  project. Test users you created locally won't exist in production; sign up fresh there.
- Set a spending limit on the Anthropic API key (console.anthropic.com → Billing) before going live,
  since screenshot scanning is billed per use.
