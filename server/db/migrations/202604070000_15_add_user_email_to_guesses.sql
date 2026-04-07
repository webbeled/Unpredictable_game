-- Add user_email column to guesses for storing login email (nullable)
ALTER TABLE guesses ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE INDEX IF NOT EXISTS guesses_user_email_idx ON guesses(user_email);

-- Optional down (not applied automatically here):
-- ALTER TABLE guesses DROP COLUMN IF EXISTS user_email;
-- DROP INDEX IF EXISTS guesses_user_email_idx;
