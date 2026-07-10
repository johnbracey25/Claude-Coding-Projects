-- ============================================================================
-- Migration 0011 — Multi-calendar ICS feed sync
-- Supports multiple named calendar feeds (Apple, Google, etc.) with
-- color labels. Events are synced into calendar_events.
-- ============================================================================

create table if not exists calendar_feeds (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  ics_url    text not null,
  color      text not null default '#6f8767',
  keyword    text,
  enabled    boolean not null default true,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

alter table calendar_feeds enable row level security;
create policy "staff_full_access" on calendar_feeds
  for all to authenticated using (true) with check (true);

create table if not exists calendar_events (
  id          uuid primary key default gen_random_uuid(),
  feed_id     uuid not null references calendar_feeds(id) on delete cascade,
  uid         text not null,
  summary     text,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_calendar_events_starts on calendar_events(starts_at);
create index if not exists idx_calendar_events_feed on calendar_events(feed_id);

alter table calendar_events enable row level security;
create policy "staff_full_access" on calendar_events
  for all to authenticated using (true) with check (true);
