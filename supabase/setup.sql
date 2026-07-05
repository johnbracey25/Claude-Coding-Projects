-- ============================================================================
-- Eve Research — full database setup (all migrations combined)
-- ----------------------------------------------------------------------------
-- HOW TO USE:
--   1. Open your Supabase project → SQL Editor → New query.
--   2. Copy this ENTIRE file, paste it in, and click "Run".
-- Safe to run more than once (enum creation is guarded).
-- ============================================================================

-- Shared trigger: keep updated_at fresh on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Enums (guarded so re-running doesn't error) ─────────────────────────────
do $$ begin
  create type person_status as enum ('active', 'inactive', 'do_not_contact');
exception when duplicate_object then null; end $$;

do $$ begin
  create type study_status as enum ('draft', 'recruiting', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type candidate_status as enum (
    'eligible', 'invited', 'responded', 'booked', 'completed', 'declined', 'ineligible'
  );
exception when duplicate_object then null; end $$;

-- ── People (contact database) ───────────────────────────────────────────────
create table if not exists people (
  id                   uuid primary key default gen_random_uuid(),
  first_name           text not null default '',
  last_name            text not null default '',
  email                text,
  phone                text,
  date_of_birth        date,
  email_opt_in         boolean not null default true,
  sms_opt_in           boolean not null default true,
  status               person_status not null default 'active',
  contact_rx           jsonb,
  eye_conditions       text[] not null default '{}',
  had_cataract_surgery boolean,
  ocular_health_issues text[] not null default '{}',
  source               text,
  tags                 text[] not null default '{}',
  notes                text,
  last_screened_at     timestamptz,
  consent_to_contact   boolean not null default false,
  signed_up_at         timestamptz,
  is_repeat_participant boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index if not exists people_email_unique
  on people (lower(email)) where email is not null and email <> '';
create index if not exists people_phone_idx on people (phone);
create index if not exists people_last_name_idx on people (lower(last_name));
create index if not exists people_status_idx on people (status);
create index if not exists people_source_idx on people (source);
create index if not exists people_repeat_idx on people (is_repeat_participant);

drop trigger if exists people_set_updated_at on people;
create trigger people_set_updated_at
  before update on people for each row execute function set_updated_at();

alter table people enable row level security;
drop policy if exists "staff_full_access" on people;
create policy "staff_full_access" on people
  for all to authenticated using (true) with check (true);

-- ── Studies ─────────────────────────────────────────────────────────────────
create table if not exists studies (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  status            study_status not null default 'draft',
  location          text,
  start_window      date,
  end_window        date,
  eligibility_rules jsonb not null default '{"all":[]}'::jsonb,
  visit_plan        jsonb not null default '{"visits":[{"name":"Visit 1","duration_min":60}]}'::jsonb,
  compensation      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists studies_set_updated_at on studies;
create trigger studies_set_updated_at
  before update on studies for each row execute function set_updated_at();

alter table studies enable row level security;
drop policy if exists "staff_full_access" on studies;
create policy "staff_full_access" on studies
  for all to authenticated using (true) with check (true);

-- ── Candidates (person ↔ study matches) ─────────────────────────────────────
create table if not exists candidates (
  id           uuid primary key default gen_random_uuid(),
  study_id     uuid not null references studies(id) on delete cascade,
  person_id    uuid not null references people(id) on delete cascade,
  status       candidate_status not null default 'eligible',
  reasons      jsonb,
  matched_at   timestamptz not null default now(),
  invited_at   timestamptz,
  responded_at timestamptz,
  notes        text,
  token        uuid not null default gen_random_uuid(),
  response     text,
  unique (study_id, person_id)
);

create index if not exists candidates_study_idx on candidates (study_id);
create index if not exists candidates_person_idx on candidates (person_id);
create index if not exists candidates_status_idx on candidates (status);
create unique index if not exists candidates_token_idx on candidates (token);

alter table candidates enable row level security;
drop policy if exists "staff_full_access" on candidates;
create policy "staff_full_access" on candidates
  for all to authenticated using (true) with check (true);

-- ── Messages (email/SMS log) ────────────────────────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid references people(id) on delete set null,
  candidate_id uuid references candidates(id) on delete set null,
  channel      text not null,
  direction    text not null default 'outbound',
  subject      text,
  body         text,
  status       text not null default 'sent',
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

-- ── Scheduling: availability windows + appointments ─────────────────────────
create table if not exists availability_windows (
  id              uuid primary key default gen_random_uuid(),
  label           text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  location        text,
  source          text not null default 'manual',
  google_event_id text,
  created_at      timestamptz not null default now()
);
create index if not exists availability_starts_idx on availability_windows (starts_at);

create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid references candidates(id) on delete set null,
  person_id       uuid references people(id) on delete cascade,
  study_id        uuid references studies(id) on delete cascade,
  visit_number    int not null default 1,
  visit_name      text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          text not null default 'scheduled',
  location        text,
  google_event_id text,
  created_at      timestamptz not null default now()
);
create index if not exists appointments_starts_idx on appointments (starts_at);
create index if not exists appointments_study_idx on appointments (study_id);
create index if not exists appointments_person_idx on appointments (person_id);

alter table availability_windows enable row level security;
alter table appointments enable row level security;
drop policy if exists "staff_full_access" on availability_windows;
create policy "staff_full_access" on availability_windows
  for all to authenticated using (true) with check (true);
drop policy if exists "staff_full_access" on appointments;
create policy "staff_full_access" on appointments
  for all to authenticated using (true) with check (true);

-- Done. Tables: people, studies, candidates, messages, availability_windows, appointments.
