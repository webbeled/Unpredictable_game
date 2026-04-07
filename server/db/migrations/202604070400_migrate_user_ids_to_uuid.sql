-- Up Migration
-- Migrate user_id columns from INTEGER to UUID using user_uuid column

-- Step 1: Alter quiz_sessions table to use user_uuid
-- Add temporary column
ALTER TABLE quiz_sessions ADD COLUMN user_uuid UUID;

-- Populate it from users table
UPDATE quiz_sessions qs
SET user_uuid = u.user_uuid
FROM users u
WHERE qs.user_id = u.id;

-- Drop old user_id constraint and column
ALTER TABLE quiz_sessions DROP CONSTRAINT quiz_sessions_user_id_fkey;
ALTER TABLE quiz_sessions DROP COLUMN user_id;

-- Rename user_uuid to user_id
ALTER TABLE quiz_sessions RENAME COLUMN user_uuid TO user_id;

-- Add back the foreign key constraint with UUID type
ALTER TABLE quiz_sessions ADD CONSTRAINT quiz_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(user_uuid) ON DELETE CASCADE;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS quiz_sessions_user_id_idx ON quiz_sessions(user_id);

-- Step 2: Alter guesses table to use user_uuid
-- Add temporary column
ALTER TABLE guesses ADD COLUMN user_uuid UUID;

-- Populate it from users table (for non-null user_ids)
UPDATE guesses g
SET user_uuid = u.user_uuid
FROM users u
WHERE g.user_id = u.id;

-- Drop old user_id column (no foreign key constraint in guesses)
ALTER TABLE guesses DROP COLUMN user_id;

-- Rename user_uuid to user_id
ALTER TABLE guesses RENAME COLUMN user_uuid TO user_id;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS guesses_user_id_uuid_idx ON guesses(user_id);

-- Down Migration (commented out)
-- This migration is difficult to reverse as it loses the original INTEGER id mapping
-- If reversal is needed, the id mapping would have to be reconstructed from participant_code

