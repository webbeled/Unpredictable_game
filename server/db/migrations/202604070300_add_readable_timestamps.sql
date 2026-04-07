-- Up Migration
-- Add human-readable timestamp columns for quiz_sessions
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS created_at_readable TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(created_at::double precision / 1000)) STORED;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS ended_at_readable TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(ended_at::double precision / 1000)) STORED;

-- Add human-readable timestamp column for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at_readable TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(created_at::double precision / 1000)) STORED;

-- Add human-readable timestamp column for guesses
ALTER TABLE guesses ADD COLUMN IF NOT EXISTS ts_readable TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(ts::double precision / 1000)) STORED;

-- Create indexes on readable timestamps for faster queries
CREATE INDEX IF NOT EXISTS quiz_sessions_created_at_readable_idx ON quiz_sessions(created_at_readable);
CREATE INDEX IF NOT EXISTS users_created_at_readable_idx ON users(created_at_readable);
CREATE INDEX IF NOT EXISTS guesses_ts_readable_idx ON guesses(ts_readable);

-- Down Migration (commented out)
-- ALTER TABLE quiz_sessions DROP COLUMN IF EXISTS created_at_readable;
-- ALTER TABLE quiz_sessions DROP COLUMN IF EXISTS ended_at_readable;
-- ALTER TABLE users DROP COLUMN IF EXISTS created_at_readable;
-- ALTER TABLE guesses DROP COLUMN IF EXISTS ts_readable;
-- DROP INDEX IF EXISTS quiz_sessions_created_at_readable_idx;
-- DROP INDEX IF EXISTS users_created_at_readable_idx;
-- DROP INDEX IF EXISTS guesses_ts_readable_idx;
