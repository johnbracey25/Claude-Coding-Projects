-- ============================================================================
-- Migration 0007 — App settings (key/value)
-- Stores small config like the Google Calendar iCal feed URL and its filter.
-- ============================================================================

create table if not exists app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;
drop policy if exists "staff_full_access" on app_settings;
create policy "staff_full_access" on app_settings
  for all to authenticated using (true) with check (true);
