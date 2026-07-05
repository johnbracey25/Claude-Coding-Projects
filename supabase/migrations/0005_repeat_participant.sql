-- ============================================================================
-- Migration 0005 — Repeat participant marker
-- Flags people who have taken part in previous studies (e.g. imported from an
-- old participant list, or auto-flagged when they complete a study).
-- ============================================================================

alter table people
  add column if not exists is_repeat_participant boolean not null default false;

create index if not exists people_repeat_idx on people (is_repeat_participant);
