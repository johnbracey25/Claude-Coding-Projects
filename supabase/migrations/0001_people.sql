-- ============================================================================
-- Migration 0001 — People (contact database)
-- The core table of participants/contacts for Eve Research.
-- ============================================================================

-- Status of a contact in the database.
create type person_status as enum ('active', 'inactive', 'do_not_contact');

create table if not exists people (
  id                  uuid primary key default gen_random_uuid(),

  -- Identity / contact
  first_name          text not null default '',
  last_name           text not null default '',
  email               text,
  phone               text,            -- stored E.164 where possible, e.g. +15551234567
  date_of_birth       date,

  -- Consent / outreach
  email_opt_in        boolean not null default true,
  sms_opt_in          boolean not null default true,
  status              person_status not null default 'active',

  -- Eye-specific profile (used by eligibility rules in Phase 2)
  contact_rx          jsonb,           -- e.g. {"od":{"sphere":-2.0},"os":{"sphere":-1.75}}
  eye_conditions      text[] not null default '{}',   -- e.g. {"dry_eye","glaucoma"}
  had_cataract_surgery boolean,
  ocular_health_issues text[] not null default '{}',  -- empty array == "no issues"

  -- Bookkeeping
  source              text,            -- where this contact came from (import, jotform, referral)
  tags                text[] not null default '{}',
  notes               text,
  last_screened_at    timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Helpful lookups for search and de-duplication.
create unique index if not exists people_email_unique
  on people (lower(email)) where email is not null and email <> '';
create index if not exists people_phone_idx on people (phone);
create index if not exists people_last_name_idx on people (lower(last_name));
create index if not exists people_status_idx on people (status);

-- Keep updated_at fresh on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists people_set_updated_at on people;
create trigger people_set_updated_at
  before update on people
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row-level security: only authenticated staff may read/write.
-- (No HIPAA scope, but the contact DB is never publicly readable.)
-- ----------------------------------------------------------------------------
alter table people enable row level security;

drop policy if exists "staff_full_access" on people;
create policy "staff_full_access"
  on people
  for all
  to authenticated
  using (true)
  with check (true);
