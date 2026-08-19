-- ============================================================================
-- Migration 0014 — Glasses as first-class columns
-- Promotes glasses info (previously nested in contact_rx) to dedicated
-- columns. Additive + backfill; contact_rx keys are left in place for any
-- rows written before the app switched to these columns (harmless, unread).
-- Applied to production via Supabase on 2026-08-19.
-- ============================================================================

alter table people add column if not exists wears_glasses boolean;
alter table people add column if not exists glasses_rx jsonb;

update people
set wears_glasses = (contact_rx->>'wears_glasses')::boolean
where contact_rx ? 'wears_glasses' and wears_glasses is null;

update people
set glasses_rx = contact_rx->'glasses'
where contact_rx ? 'glasses' and glasses_rx is null;
