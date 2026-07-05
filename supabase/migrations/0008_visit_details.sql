-- ============================================================================
-- Migration 0008 — Visit details for the day-before email
-- A study address (for a map link) and prep notes (what to bring / expect),
-- plus a per-appointment flag so the reminder email is only sent once.
-- ============================================================================

alter table studies
  add column if not exists address text;

alter table studies
  add column if not exists prep_instructions text;

alter table appointments
  add column if not exists reminder_sent_at timestamptz;
