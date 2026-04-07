-- Up Migration
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS english_speaker BOOLEAN,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Down Migration
ALTER TABLE users
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS english_speaker,
  DROP COLUMN IF EXISTS gender;
