# Eve Research — Recruiting & Scheduling App

Internal + participant-facing app for **Eve Research**, an eye-research consulting
business. Staff (John & Lauren) manage a database of people, match them to studies by
eligibility rules, invite them by email/text, and let them self-book visits into
availability windows synced from Google Calendar — including multi-visit studies with
required gaps between visits.

## Stack
- **Next.js 14** (App Router, TypeScript) — single app for staff UI + public booking.
- **Supabase** (Postgres + Auth) — database and staff login.
- **Tailwind CSS** — styling.
- **Vercel** — hosting.
- Hosted integrations: **Jotform** (intake forms), **Google Calendar** (scheduling),
  **Resend** (email), **Twilio** (SMS). Added in later phases.

## Commands
- `npm run dev` — local dev server (http://localhost:3000)
- `npm run build` — production build (must stay green)
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check (no emit)

## Layout
```
app/                 # routes (App Router)
  page.tsx           # public landing
  dashboard/         # staff home
  people/            # contact DB (Phase 1)
  studies/           # studies + eligibility (Phase 2)
  candidates/        # matching + invites (Phase 2–3)
  book/[token]/      # participant self-booking (Phase 5)
  api/               # route handlers, webhooks, cron
lib/
  supabase/          # server.ts, client.ts, admin.ts (service role)
  config.ts          # env-presence guards
  eligibility.ts     # rules evaluator (Phase 2)
  scheduling.ts      # slot computation + visit-gap rules (Phase 5)
  google.ts          # Calendar API (Phase 4)
  messaging.ts       # email + SMS (Phase 3)
supabase/migrations/ # SQL schema
```

## Conventions
- Server-side DB access uses `lib/supabase/server.ts`; browser uses
  `lib/supabase/client.ts`. The **service-role** client (`lib/supabase/admin.ts`)
  bypasses row-level security — use it ONLY in trusted server code (imports, webhooks),
  never in a Client Component.
- Pages should degrade gracefully when env vars are missing (see
  `isSupabaseConfigured` in `lib/config.ts`) rather than crashing.
- No HIPAA/BAA scope by decision. Still: keep data private, login-gate staff routes,
  never expose the service-role key to the browser.

## Setup
Copy `.env.example` to `.env.local` and fill in Supabase keys (and later messaging /
calendar credentials). Run `npm install` then `npm run dev`.
