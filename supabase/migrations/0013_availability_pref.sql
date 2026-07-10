-- ============================================================================
-- Migration 0013 — Participant availability preference
-- Captured when a candidate expresses interest. This is a general "when could
-- we call to schedule you" hint (time-of-day buckets + weekdays), NOT an actual
-- booking. Stored on the candidate so it's tied to that study's outreach.
-- ============================================================================

alter table candidates
  add column if not exists availability_pref jsonb;
