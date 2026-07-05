-- ============================================================================
-- Migration 0006 — Scheduling (availability windows + appointments)
-- Availability windows are the open blocks participants can book into (entered
-- by staff now, synced from Google Calendar later). Appointments are booked
-- visits.
-- ============================================================================

create table if not exists availability_windows (
  id              uuid primary key default gen_random_uuid(),
  label           text,                 -- e.g. "Lisa - exam room"
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  location        text,
  source          text not null default 'manual',  -- 'manual' | 'google'
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
  status          text not null default 'scheduled', -- scheduled|completed|cancelled|no_show
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
