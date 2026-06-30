# Eve Research App

Recruiting & scheduling platform for **Eve Research** (eye-research consulting).

Staff manage a database of people, match them to studies by eligibility rules, invite
them by email/text, and let participants self-book visits into Google Calendar
availability windows — including multi-visit studies with required spacing between
visits.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev                  # http://localhost:3000
```

## Tech

Next.js 14 · Supabase (Postgres + Auth) · Tailwind CSS · Vercel
Integrations (later phases): Jotform · Google Calendar · Resend (email) · Twilio (SMS)

See [`CLAUDE.md`](./CLAUDE.md) for architecture and conventions.

## Status

- [x] Phase 0 — Foundation (Next.js + Supabase scaffold)
- [x] Phase 1 — People database + CSV import
- [ ] Phase 2 — Studies + eligibility rules
- [ ] Phase 3 — Messaging (email + SMS)
- [ ] Phase 4 — Google Calendar sync
- [ ] Phase 5 — Self-booking with multi-visit rules
- [ ] Phase 6 — Reminders, dashboards, polish
