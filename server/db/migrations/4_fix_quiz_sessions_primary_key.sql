-- Up Migration
-- Only add id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_sessions' AND column_name = 'id'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN id BIGSERIAL;
  END IF;
END $$;

-- Drop old primary key if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'quiz_sessions' AND constraint_type = 'PRIMARY KEY' AND constraint_name = 'quiz_sessions_pkey'
  ) THEN
    ALTER TABLE quiz_sessions DROP CONSTRAINT quiz_sessions_pkey;
  END IF;
END $$;

-- Add new primary key on id
ALTER TABLE quiz_sessions
ADD CONSTRAINT quiz_sessions_pkey PRIMARY KEY (id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS quiz_sessions_user_id_created_at_idx
ON quiz_sessions (user_id, created_at);

CREATE INDEX IF NOT EXISTS quiz_sessions_quiz_id_idx
ON quiz_sessions (quiz_id);

-- Down Migration
DROP INDEX IF EXISTS quiz_sessions_quiz_id_idx;
DROP INDEX IF EXISTS quiz_sessions_user_id_created_at_idx;

ALTER TABLE quiz_sessions
DROP CONSTRAINT quiz_sessions_pkey;

ALTER TABLE quiz_sessions
DROP COLUMN id;

ALTER TABLE quiz_sessions
ADD CONSTRAINT quiz_sessions_pkey PRIMARY KEY (quiz_id);
