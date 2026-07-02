-- ============================================================================
-- Migration 0002 — Public signup support
-- Adds explicit research-contact consent and indexes for campaign reporting,
-- to support a public self-signup page shared on Nextdoor and elsewhere.
-- ============================================================================

-- Explicit consent to be contacted about research studies (separate from the
-- per-channel email/sms opt-ins). Captured on the public signup form.
alter table people
  add column if not exists consent_to_contact boolean not null default false;

-- When a person signed up themselves (vs. staff/import). Helps reporting.
alter table people
  add column if not exists signed_up_at timestamptz;

-- Source already exists (e.g. 'nextdoor', 'facebook'); index it so staff can
-- break down where signups are coming from.
create index if not exists people_source_idx on people (source);
