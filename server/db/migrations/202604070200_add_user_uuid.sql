-- Up Migration
-- Add uuid column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index on uuid
CREATE INDEX IF NOT EXISTS users_uuid_idx ON users(user_uuid);

-- Down Migration (commented out - uncomment if you need to rollback)
-- ALTER TABLE users DROP COLUMN IF EXISTS user_uuid;
-- DROP INDEX IF EXISTS users_uuid_idx;
