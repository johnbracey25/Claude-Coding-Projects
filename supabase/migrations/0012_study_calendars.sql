-- ============================================================================
-- Migration 0012 — Link studies to calendar feeds
-- Each study can specify which calendar feeds define its availability.
-- ============================================================================

alter table studies add column if not exists calendar_feed_ids uuid[] not null default '{}';
