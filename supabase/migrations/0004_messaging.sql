-- ============================================================================
-- Migration 0004 — Messaging & candidate responses
-- Outbound email/SMS log, plus a per-candidate token for public response links.
-- ============================================================================

-- Unguessable token used in invite links (e.g. /r/<token>) so a participant can
-- respond without logging in.
alter table candidates
  add column if not exists token uuid not null default gen_random_uuid();

alter table candidates
  add column if not exists response text;  -- free-form: 'interested' | 'declined' | ...

create unique index if not exists candidates_token_idx on candidates (token);

-- Log of every message we send (and inbound STOP/replies).
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid references people(id) on delete set null,
  candidate_id uuid references candidates(id) on delete set null,
  channel      text not null,                      -- 'email' | 'sms'
  direction    text not null default 'outbound',   -- 'outbound' | 'inbound'
  subject      text,
  body         text,
  status       text not null default 'sent',       -- 'sent' | 'failed' | 'skipped'
  provider_id  text,
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists messages_person_idx on messages (person_id);
create index if not exists messages_candidate_idx on messages (candidate_id);

alter table messages enable row level security;
drop policy if exists "staff_full_access" on messages;
create policy "staff_full_access" on messages
  for all to authenticated using (true) with check (true);
