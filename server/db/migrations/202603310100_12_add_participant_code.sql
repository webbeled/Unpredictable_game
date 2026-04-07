-- Adds a stable anonymized participant code to users for research exports
-- Add column; existing rows will be NULL until backfilled
ALTER TABLE users ADD COLUMN IF NOT EXISTS participant_code TEXT UNIQUE;

-- Note: You may wish to backfill existing users with generated codes.
-- Example backfill (run separately if desired):
-- UPDATE users SET participant_code = substr(md5(random()::text || id::text), 1, 8);
-- The above is a quick approach but not guaranteed uppercase alphanumeric; consider a deterministic script for backfill.
