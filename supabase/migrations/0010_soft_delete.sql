-- Soft-delete support: archived records are hidden from the UI but can be
-- recovered within 30 days.
ALTER TABLE people ADD COLUMN IF NOT EXISTS archived_at timestamptz;
