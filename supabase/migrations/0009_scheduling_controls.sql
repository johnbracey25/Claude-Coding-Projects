-- ============================================================================
-- Migration 0009 — Per-study scheduling controls
-- Buffer between visits and a minimum booking lead time (notice).
-- ============================================================================

alter table studies
  add column if not exists buffer_min int not null default 0;

alter table studies
  add column if not exists min_lead_hours int not null default 0;
