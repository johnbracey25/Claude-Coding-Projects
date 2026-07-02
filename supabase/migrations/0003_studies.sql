-- ============================================================================
-- Migration 0003 — Studies, eligibility, and candidate matching
-- ============================================================================

create type study_status as enum ('draft', 'recruiting', 'closed');

create table if not exists studies (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  status            study_status not null default 'draft',
  location          text,

  -- Recruitment window (when visits can be scheduled).
  start_window      date,
  end_window        date,

  -- Eligibility rules: { "all": [ { field, op, value }, ... ] }  (see lib/eligibility.ts)
  eligibility_rules jsonb not null default '{"all":[]}'::jsonb,

  -- Visit plan: { "visits": [ { "name": "...", "duration_min": 60,
  --   "min_gap_days": 7, "max_gap_days": 14 }, ... ] }  (gaps are from prior visit)
  visit_plan        jsonb not null default '{"visits":[{"name":"Visit 1","duration_min":60}]}'::jsonb,

  -- Compensation / incentive shown to participants (optional).
  compensation      text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists studies_set_updated_at on studies;
create trigger studies_set_updated_at
  before update on studies
  for each row execute function set_updated_at();

-- Candidate = a person matched/considered for a study.
create type candidate_status as enum (
  'eligible', 'invited', 'responded', 'booked', 'completed', 'declined', 'ineligible'
);

create table if not exists candidates (
  id          uuid primary key default gen_random_uuid(),
  study_id    uuid not null references studies(id) on delete cascade,
  person_id   uuid not null references people(id) on delete cascade,
  status      candidate_status not null default 'eligible',

  -- Per-rule evaluation snapshot at match time (for "why (in)eligible").
  reasons     jsonb,

  matched_at  timestamptz not null default now(),
  invited_at  timestamptz,
  responded_at timestamptz,
  notes       text,

  unique (study_id, person_id)
);

create index if not exists candidates_study_idx on candidates (study_id);
create index if not exists candidates_person_idx on candidates (person_id);
create index if not exists candidates_status_idx on candidates (status);

-- ----------------------------------------------------------------------------
-- RLS: staff-only access (same posture as people).
-- ----------------------------------------------------------------------------
alter table studies enable row level security;
alter table candidates enable row level security;

drop policy if exists "staff_full_access" on studies;
create policy "staff_full_access" on studies
  for all to authenticated using (true) with check (true);

drop policy if exists "staff_full_access" on candidates;
create policy "staff_full_access" on candidates
  for all to authenticated using (true) with check (true);
